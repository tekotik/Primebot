#!/usr/bin/env python3
"""
PrimeAvtoExport Telegram Bot (Primebot)
======================================
Реализация бота по техническому заданию:
1. Эндпоинт: https://primeavtoexport.com/staging/api/bot-feed.php?key=5f17153da0663379d06efa746e2fe65a
2. Команды:
   - /start, /help - приветствие и инструкция
   - /timed [марка] [модель] - поиск timed-торгов (IAAI & Copart)
   - /day <дд.мм.гггг> [марка] [модель] - поиск торгов на конкретный день
   - /filter - выбор титула (clean, salvage...) и диапазона годов
   - /autocollect [марка] [модель] - подписка на ежедневную подборку 1 раз в день
3. Правила по времени:
   - Для timed-лотов (is_timed: true): показывать ТОЛЬКО countdown.text_hours.
     Поле auction_date НЕ показывать вообще!
   - Для обычных торгов (is_timed: false): показывать countdown.text_days.
4. Кэширование:
   - 5 минут на идентичные запросы (не перегружать сервер).
5. Ссылки:
   - Кнопка 1: "🔗 Лот на аукционе" -> lot['link']
   - Кнопка 2: "💰 Расчёт под ключ" -> {site_base}/ru/calculator/?lot={lot_id}
"""

import os
import sys
import time
import json
import logging
import asyncio
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
import aiohttp

from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    InputMediaPhoto,
    WebAppInfo,
    MenuButtonWebApp
)
from telegram.constants import ParseMode
from telegram.ext import (
    Application,
    CommandHandler,
    CallbackQueryHandler,
    ContextTypes,
    MessageHandler,
    filters
)

# ----------------- КОНФИГУРАЦИЯ СЕРВЕРА И ОКРУЖЕНИЯ -----------------
# Замечание 2 от разработчика:
# При выкатке на прод path /staging убирается; feed_key меняется одной переменной.
ENVIRONMENT = os.getenv("PRIME_ENV", "production").lower()
IS_PRODUCTION = ENVIRONMENT not in ("staging", "stage", "dev")

DEFAULT_SITE_BASE = "https://primeavtoexport.com" if IS_PRODUCTION else "https://primeavtoexport.com/staging"
SITE_BASE_URL = os.getenv("PRIME_SITE_BASE", DEFAULT_SITE_BASE).rstrip("/")

API_STATIC_KEY = os.getenv("BOT_FEED_KEY") or os.getenv("PRIME_FEED_KEY", "5f17153da0663379d06efa746e2fe65a")
API_BASE_URL = f"{SITE_BASE_URL}/api/bot-feed.php"
WATCH_API_BASE_URL = os.getenv("PRIME_WATCH_URL", f"{SITE_BASE_URL}/api/bot-watch.php")

# Mini App лежит на Vercel. Открывать его нужно из чата бота - только тогда
# Telegram даёт приложению право sendData, и подписка доходит до воркера.
BOT_APP_URL = os.getenv("PRIME_APP_URL", "https://primebot-yw54.vercel.app").rstrip("/")

# Токен берется из переменной окружения TELEGRAM_BOT_TOKEN
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# Интервал автосборщика (по умолчанию 600 сек = 10 минут для тестов, переключается на 86400 сек = 1 сутки)
WATCH_SCHEDULE_INTERVAL_SEC = int(os.getenv("WATCH_INTERVAL_SEC", "600"))
WATCH_DEFAULT_LIMIT = int(os.getenv("WATCH_LIMIT", "30"))

# Настройки скорости для бота в Telegram (10-12 секунд ответ)
DEFAULT_PAGES = 5
DEFAULT_DETAIL_LIMIT = 15
DEFAULT_LIMIT = 10

# Настройка логирования
logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    level=logging.INFO
)
logger = logging.getLogger("PrimeBot")

# 5-минутный кэш: { cache_key: (timestamp, data) }
QUERY_CACHE: Dict[str, tuple[float, Dict[str, Any]]] = {}
CACHE_TTL = 300  # 5 минут

# Пользовательские фильтры в памяти: { user_id: { "document": "clean", "year_from": 2020 } }
USER_PREFERENCES: Dict[int, Dict[str, Any]] = {}

# Подписки на автосборщик (1 раз в день): { user_id: { "make": "BMW", "model": "X5" } }
SUBSCRIBERS_FILE = os.path.join(os.path.dirname(__file__), "subscribers.json")
DAILY_SUBSCRIBERS: Dict[int, Dict[str, str]] = {}


def normalize_make(raw_make: str) -> str:
    """Нормализует написание брендов (Mercedes-Benz, Ram, BMW)."""
    if not raw_make:
        return ""
    m = raw_make.strip()
    if m.lower() in ["mercedes", "mercedes benz", "mercedes-benz", "benz", "мерседес"]:
        return "Mercedes-Benz"
    if m.lower() in ["ram", "рам"]:
        return "Ram"
    if m.lower() in ["bmw", "бмв"]:
        return "BMW"
    return m


def load_subscribers():
    """Загрузка подписок из файла subscribers.json при старте бота."""
    global DAILY_SUBSCRIBERS
    try:
        if os.path.exists(SUBSCRIBERS_FILE):
            with open(SUBSCRIBERS_FILE, "r", encoding="utf-8") as f:
                raw_data = json.load(f)
                DAILY_SUBSCRIBERS = {int(k): v for k, v in raw_data.items()}
                logger.info(f"Загружено {len(DAILY_SUBSCRIBERS)} сохраненных подписок из {SUBSCRIBERS_FILE}")
    except Exception as e:
        logger.error(f"Ошибка чтения {SUBSCRIBERS_FILE}: {e}")


def save_subscribers():
    """Сохранение подписок в файл subscribers.json на диск."""
    try:
        with open(SUBSCRIBERS_FILE, "w", encoding="utf-8") as f:
            json.dump(DAILY_SUBSCRIBERS, f, ensure_ascii=False, indent=2)
    except Exception as e:
        logger.error(f"Ошибка сохранения {SUBSCRIBERS_FILE}: {e}")


def calculate_live_countdown(lot: Dict[str, Any]) -> str:
    """
    Замечание 1 от разработчика:
    Не кэшировать текст countdown.text_hours — при 5-минутном кэше он устаревает.
    Кэшировать ответ, а строку пересчитывать из countdown.close_utc при каждой отправке!
    """
    is_timed = lot.get("is_timed", False)
    countdown = lot.get("countdown") or {}
    close_utc_str = countdown.get("close_utc") or lot.get("bid_close_date")

    if not close_utc_str:
        if is_timed:
            return countdown.get("text_hours") or "время уточняется"
        return countdown.get("text_days") or lot.get("auction_date", "дата уточняется")

    try:
        # Нормализуем ISO строку даты
        clean_str = close_utc_str.strip().replace("Z", "+00:00")
        if ".000+" in clean_str:
            clean_str = clean_str.replace(".000+", "+")
        if "T" not in clean_str and " " in clean_str:
            clean_str = clean_str.replace(" ", "T")
        if "+" not in clean_str and not clean_str.endswith("+00:00"):
            clean_str += "+00:00"

        target_dt = datetime.fromisoformat(clean_str)
        now_utc = datetime.now(timezone.utc)
        diff = target_dt - now_utc

        if diff.total_seconds() <= 0:
            return "Торги завершены"

        total_seconds = int(diff.total_seconds())
        total_hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        if is_timed:
            # Для timed: строго часы и минуты без дней (по пункту 5 ТЗ)
            return f"{total_hours}ч {minutes:02d}м"
        else:
            # Для обычных торгов: дни и часы
            days = diff.days
            hours = (diff.seconds // 3600)
            if days > 0:
                return f"{days}д {hours}ч"
            return f"{hours}ч {minutes:02d}м"
    except Exception as e:
        logger.debug(f"Ошибка парсинга close_utc '{close_utc_str}': {e}")
        if is_timed:
            return countdown.get("text_hours") or "уточняется"
        return countdown.get("text_days") or lot.get("auction_date", "уточняется")


def normalize_lot_url(url: str) -> str:
    """Нормализует ссылку в зависимости от окружения (staging vs prod)."""
    if not url:
        return url
    if IS_PRODUCTION:
        return url.replace("https://primeavtoexport.com/staging", "https://primeavtoexport.com")
    return url


def get_cached(key: str) -> Optional[Dict[str, Any]]:
    """Возвращает кэшированный ответ, если прошло меньше 5 минут."""
    if key in QUERY_CACHE:
        ts, data = QUERY_CACHE[key]
        if time.time() - ts < CACHE_TTL:
            return data
    return None


def set_cached(key: str, data: Dict[str, Any]):
    """Сохраняет ответ в кэш на 5 минут."""
    QUERY_CACHE[key] = (time.time(), data)


async def fetch_bot_feed(params: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Выполняет асинхронный GET-запрос к bot-feed.php с проверкой кэша.
    """
    params["key"] = API_STATIC_KEY
    if "pages" not in params:
        params["pages"] = DEFAULT_PAGES
    if "detail_limit" not in params:
        params["detail_limit"] = DEFAULT_DETAIL_LIMIT
    if "limit" not in params:
        params["limit"] = DEFAULT_LIMIT

    # Формируем ключ кэша из отсортированных параметров (без ключа авторизации)
    cache_key_parts = [f"{k}={v}" for k, v in sorted(params.items()) if k != "key"]
    cache_key = "&".join(cache_key_parts)

    cached_data = get_cached(cache_key)
    if cached_data:
        logger.info(f"Взят ответ из 5-минутного кэша для: {cache_key}")
        return cached_data

    logger.info(f"Запрос к bot-feed.php: {cache_key}")
    try:
        timeout = aiohttp.ClientTimeout(total=25)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(API_BASE_URL, params=params) as resp:
                if resp.status == 200:
                    json_data = await resp.json()
                    if json_data.get("status") == "ok":
                        set_cached(cache_key, json_data)
                        return json_data
                    else:
                        logger.warning(f"Ошибка API: {json_data.get('message')}")
                elif resp.status == 403:
                    logger.error("HTTP 403: неверный или отсутствующий ключ API")
                elif resp.status == 422:
                    logger.error("HTTP 422: некорректный параметр запроса")
    except Exception as e:
        logger.error(f"Исключение при запросе к bot-feed.php: {e}")

    return None


def get_lot_primary_photo(lot: Dict[str, Any]) -> Optional[str]:
    """Возвращает проверенную ссылку на фото (приоритет массиву photos из коммита a355e2d)"""
    photos = lot.get("photos")
    if photos and isinstance(photos, list) and len(photos) > 0 and photos[0]:
        return photos[0]
    return lot.get("photo")


def format_lot_message(lot: Dict[str, Any]) -> tuple[str, InlineKeyboardMarkup]:
    """
    Форматирует карточку лота согласно техническому заданию:
    - Фото: sendPhoto
    - Год + Марка + Модель + Серия
    - Ставка и «купить сейчас»
    - Площадка + номер лота + штат
    - До закрытия (часы для timed)
    - Ссылка на лот и ссылка на расчет под ключ
    """
    year = lot.get("year", "")
    make = lot.get("make", "")
    model = lot.get("model", "")
    series = lot.get("series") or ""
    title_line = f"🚗 <b>{year} {make} {model} {series}</b>".strip()

    bid = lot.get("current_bid")
    buy_now = lot.get("buy_now")
    if bid is not None and isinstance(bid, (int, float)) and bid > 0:
        bid_text = f"${int(bid):,}".replace(",", " ")
        price_line = f"💵 <b>Текущая ставка:</b> {bid_text}"
    else:
        price_line = "💵 <b>Текущая ставка:</b> нет ставок"

    if buy_now and isinstance(buy_now, (int, float)) and buy_now > 0:
        buy_now_text = f"${int(buy_now):,}".replace(",", " ")
        price_line += f" | <b>Buy Now:</b> {buy_now_text}"

    platform = lot.get("platform", "IAAI")
    lot_id = lot.get("lot_id", "")
    state = lot.get("state", "US")
    site_info = f"🏛 <b>Площадка:</b> {platform} (лот <code>#{lot_id}</code>, {state})"

    # --- ПРАВИЛА ПО ВРЕМЕНИ (ТЕХНИЧЕСКОЕ ЗАДАНИЕ ПУНКТ 5 И ЗАМЕЧАНИЕ 1) ---
    # Не кэшируем text_hours, а пересчитываем динамически от close_utc в момент отправки
    is_timed = lot.get("is_timed", False)
    time_left = calculate_live_countdown(lot)
    
    if is_timed:
        # Для timed лотов: строго остаток часов и минут. auction_date НЕ показывать!
        time_line = f"⏳ <b>До закрытия торгов:</b> {time_left}"
    else:
        # Для обычных торгов
        time_line = f"📅 <b>Дата торгов:</b> {time_left}"

    # Документы и состояние
    doc = lot.get("document", "clean")
    status = lot.get("status", "Runs")
    specs_line = f"📄 <b>Титул:</b> {doc.capitalize()} | <b>Статус:</b> {status}"

    odometer = lot.get("odometer_mi")
    odo_line = f"🛣 <b>Пробег:</b> {odometer:,} миль".replace(",", " ") if odometer else ""

    vin = lot.get("vin")
    vin_line = f"🔑 <b>VIN:</b> <code>{vin}</code>" if vin else ""

    text_parts = [title_line]
    if vin_line:
        text_parts.append(vin_line)
    text_parts.extend([price_line, site_info, time_line, specs_line])
    if odo_line:
        text_parts.append(odo_line)

    caption = "\n".join(text_parts)

    # Три ссылки:
    # 1. link - прямая ссылка на страницу лота
    # 2. {site_base}/ru/calculator/?lot={lot_id} - ссылка на официальный расчет
    # 3. carcheckbot - проверка по VIN, лот подставляется в ?lot=
    raw_lot_link = lot.get("link") or f"https://www.iaai.com/VehicleDetail/{lot_id}"
    lot_link = normalize_lot_url(raw_lot_link)
    calc_link = f"{SITE_BASE_URL}/ru/calculator/?lot={lot_id}"

    keyboard = [
        [
            InlineKeyboardButton("🔗 Лот на аукционе", url=lot_link),
            InlineKeyboardButton("💰 Расчёт под ключ", url=calc_link)
        ]
    ]

    if vin and lot_id:
        check_link = f"https://carcheckbot.com/ru/car/{vin}?lot={lot_id}"
        keyboard.append([InlineKeyboardButton("🔎 Проверка по VIN", url=check_link)])

    return caption, InlineKeyboardMarkup(keyboard)


async def fetch_bot_watch(params: Dict[str, Any], reset: bool = False) -> Optional[Dict[str, Any]]:
    """
    Запрос к https://primeavtoexport.com/api/bot-watch.php
    Серверная дедупликация (неделя жизни, последние 3000 номеров).
    Повторно ничего не отфильтровываем и не кэшируем локально.
    """
    request_params = dict(params)
    request_params["key"] = API_STATIC_KEY
    if reset:
        request_params["reset"] = 1

    # Защита: правильное написание брендов (Ram, Mercedes-Benz)
    if "make" in request_params and request_params["make"]:
        raw_make = str(request_params["make"]).strip()
        if raw_make.lower() == "mercedes":
            request_params["make"] = "Mercedes-Benz"
        elif raw_make.lower() == "ram":
            request_params["make"] = "Ram"

    logger.info(f"Запрос к bot-watch.php: {request_params}")
    try:
        timeout = aiohttp.ClientTimeout(total=30)
        async with aiohttp.ClientSession(timeout=timeout) as session:
            async with session.get(WATCH_API_BASE_URL, params=request_params) as resp:
                if resp.status == 200:
                    data = await resp.json()
                    return data
                else:
                    logger.warning(f"bot-watch.php вернул HTTP {resp.status}")
    except Exception as e:
        logger.error(f"Ошибка при запросе к bot-watch.php: {e}")

    return None


# ==================== ОБРАБОТЧИКИ КОМАНД ====================

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /start"""
    text = (
        "👋 <b>Добро пожаловать в бота PrimeAvtoExport!</b>\n\n"
        "Я ищу актуальные автомобили на аукционах <b>Copart</b> и <b>IAAI (Timed)</b> "
        "с точным расчетом времени до закрытия торгов и стоимостью под ключ в РФ.\n\n"
        "📌 <b>Основные команды:</b>\n"
        "• <code>/timed</code> — свежие лоты с закрывающимися timed-торгами\n"
        "• <code>/timed BMW X5</code> — timed-лоты конкретной марки/модели\n"
        "• <code>/day 05.10.2026 BMW X5</code> — торги на определенную дату (дд.мм.гггг)\n"
        "• <code>/filter</code> — фильтр по типу титула (Clean / Salvage) и годам\n"
        "• <code>/autocollect BMW X5</code> — подписка на ежедневную подборку (1 раз в день)\n"
        "• <code>/help</code> — полная справка по боту"
    )
    keyboard = [
        [
            InlineKeyboardButton("🤖 Открыть автоподбор", web_app=WebAppInfo(url=BOT_APP_URL))
        ],
        [
            InlineKeyboardButton("⚡ Быстрый поиск Timed", callback_data="cmd_quick_timed"),
            InlineKeyboardButton("⚙️ Фильтры", callback_data="cmd_open_filters")
        ],
        [
            InlineKeyboardButton("🌐 Открыть веб-каталог", url=f"{SITE_BASE_URL}/")
        ]
    ]
    await update.message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=InlineKeyboardMarkup(keyboard))


async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /help"""
    text = (
        "📖 <b>Справка по использованию бота:</b>\n\n"
        "1️⃣ <b>Timed-торги (поминутные аукционы IAAI & Copart):</b>\n"
        "• <code>/timed</code> — последние закрывающиеся лоты\n"
        "• <code>/timed RAM ProMaster 2500</code> — точный поиск модели с цифрой\n"
        "• <code>/timed Lexus RX</code>\n\n"
        "2️⃣ <b>Торги на конкретный день:</b>\n"
        "• <code>/day 06.10.2026 Toyota Camry</code>\n"
        "• Формат даты: <b>дд.мм.гггг</b>\n\n"
        "3️⃣ <b>Автосборщик 1 раз в день:</b>\n"
        "• <code>/autocollect BMW X5</code> — бот будет каждый день присылать свежую подборку новых лотов.\n\n"
        "⏱ <i>Ответ обычно формируется за 10-12 секунд (глубина поиска 5 страниц). Результаты кэшируются на 5 минут.</i>"
    )
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)


async def timed_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Команда /timed [марка] [модель]
    """
    args = context.args or []
    make = ""
    model = ""

    if len(args) == 1:
        make = args[0]
    elif len(args) >= 2:
        make = args[0]
        model = " ".join(args[1:])

    status_msg = await update.message.reply_text(
        f"🔍 Ищу актуальные timed-лоты <b>{make} {model}</b>...\n⏳ <i>Это займет 8–12 секунд</i>",
        parse_mode=ParseMode.HTML
    )

    params: Dict[str, Any] = {
        "timed": 1,
        "pages": DEFAULT_PAGES,
        "detail_limit": DEFAULT_DETAIL_LIMIT,
        "limit": DEFAULT_LIMIT
    }
    if make:
        params["make"] = make
    if model:
        params["model"] = model

    # Учитываем фильтры пользователя, если заданы
    user_id = update.effective_user.id
    if user_id in USER_PREFERENCES:
        pref = USER_PREFERENCES[user_id]
        if pref.get("document"):
            params["document"] = pref["document"]
        if pref.get("year_from"):
            params["year_from"] = pref["year_from"]

    data = await fetch_bot_feed(params)
    await status_msg.delete()

    if not data or not data.get("lots"):
        msg = f"❌ По запросу <b>{make} {model}</b> timed-лотов не найдено.\nПопробуйте другую марку или модель."
        await update.message.reply_text(msg, parse_mode=ParseMode.HTML)
        return

    lots = data["lots"]
    count = len(lots)
    
    time_info = ""
    if data.get("server_time_utc"):
        try:
            dt = datetime.fromisoformat(data["server_time_utc"].replace("Z", "+00:00"))
            time_info = f" <i>(данные от {dt.strftime('%H:%M')} UTC)</i>"
        except Exception:
            pass

    await update.message.reply_text(
        f"✅ Найдено <b>{count}</b> лотов с активными торгами{time_info}:",
        parse_mode=ParseMode.HTML
    )

    for lot in lots:
        caption, keyboard = format_lot_message(lot)
        photo_url = get_lot_primary_photo(lot)
        try:
            if photo_url:
                await update.message.reply_photo(
                    photo=photo_url,
                    caption=caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
            else:
                await update.message.reply_text(
                    caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
        except Exception as e:
            logger.warning(f"Ошибка отправки фото для лота {lot.get('lot_id')}: {e}")
            await update.message.reply_text(
                caption,
                parse_mode=ParseMode.HTML,
                reply_markup=keyboard
            )
        await asyncio.sleep(0.3)


async def day_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """
    Команда /day <дд.мм.гггг> [марка] [модель]
    """
    args = context.args or []
    if not args:
        await update.message.reply_text(
            "⚠️ Пожалуйста, укажите дату торгов:\n"
            "Пример: <code>/day 05.10.2026 Toyota Camry</code>",
            parse_mode=ParseMode.HTML
        )
        return

    raw_date = args[0]
    # Преобразуем дд.мм.гггг в ГГГГ-ММ-ДД
    try:
        dt = datetime.strptime(raw_date, "%d.%m.%Y")
        iso_date = dt.strftime("%Y-%m-%d")
    except ValueError:
        try:
            dt = datetime.strptime(raw_date, "%Y-%m-%d")
            iso_date = dt.strftime("%Y-%m-%d")
        except ValueError:
            await update.message.reply_text(
                "❌ Неверный формат даты. Используйте формат: <b>дд.мм.гггг</b> (например: <code>05.10.2026</code>)",
                parse_mode=ParseMode.HTML
            )
            return

    make = args[1] if len(args) > 1 else ""
    model = " ".join(args[2:]) if len(args) > 2 else ""

    status_msg = await update.message.reply_text(
        f"🔍 Ищу торги на дату <b>{raw_date}</b> ({make} {model})...\n⏳ <i>Подождите 8-12 секунд</i>",
        parse_mode=ParseMode.HTML
    )

    params: Dict[str, Any] = {
        "timed": 0,
        "date": iso_date,
        "pages": DEFAULT_PAGES,
        "detail_limit": DEFAULT_DETAIL_LIMIT,
        "limit": DEFAULT_LIMIT
    }
    if make:
        params["make"] = make
    if model:
        params["model"] = model

    data = await fetch_bot_feed(params)
    await status_msg.delete()

    if not data or not data.get("lots"):
        await update.message.reply_text(
            f"❌ На дату <b>{raw_date}</b> лотов по вашему запросу не найдено.",
            parse_mode=ParseMode.HTML
        )
        return

    lots = data["lots"]
    time_info = ""
    if data.get("server_time_utc"):
        try:
            dt = datetime.fromisoformat(data["server_time_utc"].replace("Z", "+00:00"))
            time_info = f" <i>(данные от {dt.strftime('%H:%M')} UTC)</i>"
        except Exception:
            pass

    await update.message.reply_text(
        f"✅ Найдено <b>{len(lots)}</b> лотов на <b>{raw_date}</b>{time_info}:",
        parse_mode=ParseMode.HTML
    )

    for lot in lots:
        caption, keyboard = format_lot_message(lot)
        photo_url = get_lot_primary_photo(lot)
        try:
            if photo_url:
                await update.message.reply_photo(
                    photo=photo_url,
                    caption=caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
            else:
                await update.message.reply_text(
                    caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
        except Exception as e:
            logger.warning(f"Ошибка отправки фото: {e}")
            await update.message.reply_text(caption, parse_mode=ParseMode.HTML, reply_markup=keyboard)
        await asyncio.sleep(0.3)


async def filter_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /filter - интерактивный выбор параметров"""
    user_id = update.effective_user.id
    current_pref = USER_PREFERENCES.get(user_id, {})
    doc_pref = current_pref.get("document", "все")
    year_pref = current_pref.get("year_from", "любой")

    text = (
        "⚙️ <b>Настройка постоянных фильтров поиска:</b>\n\n"
        f"• Тип титула (документов): <b>{doc_pref}</b>\n"
        f"• Год выпуска от: <b>{year_pref}</b>\n\n"
        "Выберите нужный параметр:"
    )

    keyboard = [
        [
            InlineKeyboardButton("📄 Чистый титул (Clean)", callback_data="set_doc_clean"),
            InlineKeyboardButton("🛠 Salvage", callback_data="set_doc_salvage")
        ],
        [
            InlineKeyboardButton("📅 Год от 2021", callback_data="set_year_2021"),
            InlineKeyboardButton("📅 Год от 2018", callback_data="set_year_2018")
        ],
        [
            InlineKeyboardButton("🔄 Сбросить фильтры", callback_data="reset_filters")
        ]
    ]

    await update.message.reply_text(text, parse_mode=ParseMode.HTML, reply_markup=InlineKeyboardMarkup(keyboard))


def split_years(args: List[str]):
    """Год из команды: 2019 или 2018-2020 (и 2018..2020). Остальное - марка/модель.
    Диапазон лет узкий специально: 'ProMaster 2500' не должен читаться как год."""
    def is_year(t):
        return len(t) == 4 and t.isdigit() and 1980 <= int(t) <= 2030

    years, words = [], []
    for token in args:
        t = token.strip().replace("..", "-")
        if is_year(t):
            years.append(int(t))
            continue
        parts = t.split("-")
        if len(parts) == 2 and all(is_year(p) for p in parts):
            years += [int(parts[0]), int(parts[1])]
            continue
        words.append(token.strip())
    if not years:
        return words, "", ""
    return words, str(min(years)), str(max(years))


async def autocollect_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Команда /autocollect [марка] [модель] [годы] - подписка автосборщика"""
    user_id = update.effective_user.id
    args = context.args or []
    if not args:
        text = (
            "🤖 <b>Настройка Автосборщика (1 раз в день):</b>\n\n"
            "Выберите марку и модель из списка или отправьте сообщением:\n"
            "<code>/autocollect BMW X5 2018-2020</code> или <code>/autocollect RAM ProMaster 2500</code>\n\n"
            "Остановить: <code>/stop</code>"
        )
        keyboard = [
            [
                InlineKeyboardButton("🚐 RAM ProMaster 2500", callback_data="col_RAM_ProMaster 2500"),
                InlineKeyboardButton("🚙 BMW X5", callback_data="col_BMW_X5")
            ],
            [
                InlineKeyboardButton("🏎 Ford Mustang", callback_data="col_Ford_Mustang"),
                InlineKeyboardButton("🚗 Toyota Camry", callback_data="col_Toyota_Camry")
            ],
            [
                InlineKeyboardButton("⚡ Tesla Model Y", callback_data="col_Tesla_Model Y"),
                InlineKeyboardButton("🛡 Jeep Grand Cherokee", callback_data="col_Jeep_Grand Cherokee")
            ]
        ]
        await update.message.reply_text(
            text,
            parse_mode=ParseMode.HTML,
            reply_markup=InlineKeyboardMarkup(keyboard)
        )
        return

    words, year_from, year_to = split_years(args)
    if not words:
        await update.message.reply_text(
            "Нужна марка. Пример: <code>/autocollect BMW X5 2018-2020</code>",
            parse_mode=ParseMode.HTML
        )
        return

    make = normalize_make(words[0])
    model = " ".join(words[1:])

    subscription = {"make": make, "model": model}
    if year_from:
        subscription["year_from"] = year_from
        subscription["year_to"] = year_to
    DAILY_SUBSCRIBERS[user_id] = dict(subscription, subscribed_at=str(datetime.now()))
    save_subscribers()

    text = (
        f"⚡ <b>Автосборщик запущен!</b>\n\n"
        f"🎯 Ищем: <b>{describe_subscription(DAILY_SUBSCRIBERS[user_id])}</b>\n"
        f"📅 Периодичность: <b>автоматически при появлении новых лотов</b>\n\n"
        "Запрашиваю текущие актуальные автомобили с аукциона прямо сейчас..."
    )
    await update.message.reply_text(text, parse_mode=ParseMode.HTML)
    # Сразу запускаем первый проход для мгновенной выдачи
    await watch_now_command(update, context)


async def autocollect_stop_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """/stop - снять подписку автосборщика, ничего не удаляя из ленты."""
    user_id = update.effective_user.id
    if DAILY_SUBSCRIBERS.pop(user_id, None) is None:
        await update.message.reply_text("Активной подписки автосборщика нет.")
        return
    save_subscribers()
    await update.message.reply_text(
        "⏹ <b>Автосборщик остановлен</b> - подписка удалена.",
        parse_mode=ParseMode.HTML
    )


# ==================== CALLBACKS ДЛЯ INLINE КНОПОК ====================

async def button_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    data = query.data
    user_id = update.effective_user.id

    if user_id not in USER_PREFERENCES:
        USER_PREFERENCES[user_id] = {}

    if data == "cmd_quick_timed":
        await query.message.reply_text("Ищу свежие timed-лоты...")
        feed = await fetch_bot_feed({"timed": 1, "pages": 3, "detail_limit": 5, "limit": 5})
        if feed and feed.get("lots"):
            for lot in feed["lots"]:
                caption, keyboard = format_lot_message(lot)
                photo_url = get_lot_primary_photo(lot)
                if photo_url:
                    await query.message.reply_photo(photo_url, caption=caption, parse_mode=ParseMode.HTML, reply_markup=keyboard)
                else:
                    await query.message.reply_text(caption, parse_mode=ParseMode.HTML, reply_markup=keyboard)
                await asyncio.sleep(0.3)
        else:
            await query.message.reply_text("Лотов не найдено.")

    elif data == "cmd_open_filters":
        await filter_command(update, context)

    elif data == "set_doc_clean":
        USER_PREFERENCES[user_id]["document"] = "clean"
        await query.edit_message_text("✅ Установлен фильтр: <b>Чистый титул (Clean)</b>", parse_mode=ParseMode.HTML)

    elif data == "set_doc_salvage":
        USER_PREFERENCES[user_id]["document"] = "salvage"
        await query.edit_message_text("✅ Установлен фильтр: <b>Salvage</b>", parse_mode=ParseMode.HTML)

    elif data == "set_year_2021":
        USER_PREFERENCES[user_id]["year_from"] = 2021
        await query.edit_message_text("✅ Установлен фильтр: <b>Год выпуска от 2021</b>", parse_mode=ParseMode.HTML)

    elif data == "set_year_2018":
        USER_PREFERENCES[user_id]["year_from"] = 2018
        await query.edit_message_text("✅ Установлен фильтр: <b>Год выпуска от 2018</b>", parse_mode=ParseMode.HTML)

    elif data == "reset_filters":
        USER_PREFERENCES.pop(user_id, None)
        await query.edit_message_text("🔄 Все фильтры сброшены.", parse_mode=ParseMode.HTML)

    elif data.startswith("col_"):
        parts = data[4:].split("_", 1)
        make = normalize_make(parts[0])
        model = parts[1] if len(parts) > 1 else ""
        DAILY_SUBSCRIBERS[user_id] = {
            "make": make,
            "model": model,
            "subscribed_at": str(datetime.now())
        }
        save_subscribers()
        text = (
            f"⚡ <b>Автосборщик запущен!</b>\n\n"
            f"🎯 Ищем: <b>{make} {model}</b>\n"
            f"📅 Периодичность: <b>автоматически при появлении новых лотов</b>\n\n"
            "Запрашиваю текущие актуальные автомобили с аукциона прямо сейчас..."
        )
        await query.edit_message_text(text, parse_mode=ParseMode.HTML)
        await watch_now_command(update, context)


async def web_app_data_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Обработчик подписки из Telegram Mini App (Web App data)."""
    if not update.message or not update.message.web_app_data:
        return
    user_id = update.effective_user.id
    raw_data = update.message.web_app_data.data
    logger.info(f"web_app_data от {user_id}: {raw_data}")
    try:
        data = json.loads(raw_data)
        action = data.get("action")
        if action in ("autocollect", "subscribe", "autocollect_update"):
            make = normalize_make(data.get("make", ""))
            model = data.get("model", "")
            DAILY_SUBSCRIBERS[user_id] = dict(
                subscriber_filter(data),
                make=make,
                model=model,
                subscribed_at=str(datetime.now())
            )
            save_subscribers()
            if action == "autocollect_update":
                # Смена фильтра при активной подписке: параметры обновили,
                # новый проход не запускаем, иначе каждое изменение = скан.
                await update.message.reply_text(
                    f"🔄 <b>Фильтр подписки обновлён</b>\n\n"
                    f"🎯 Теперь ищем: <b>{describe_subscription(DAILY_SUBSCRIBERS[user_id])}</b>",
                    parse_mode=ParseMode.HTML
                )
                return
            await update.message.reply_text(
                f"⚡ <b>Автосборщик запущен из приложения!</b>\n\n"
                f"🎯 Ищем: <b>{describe_subscription(DAILY_SUBSCRIBERS[user_id])}</b>\n\n"
                "Запрашиваю актуальные автомобили с аукциона...",
                parse_mode=ParseMode.HTML
            )
            await watch_now_command(update, context)
        elif action in ("autocollect_stop", "unsubscribe"):
            DAILY_SUBSCRIBERS.pop(user_id, None)
            save_subscribers()
            await update.message.reply_text(
                "⏹ <b>Автосборщик остановлен</b> - подписка удалена.",
                parse_mode=ParseMode.HTML
            )
    except Exception as e:
        logger.error(f"Ошибка парсинга web_app_data: {e}")


async def log_any_update(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Журнал входящих апдейтов во второй группе обработчиков: пишет, что бот
    получил сообщение, даже если его никто не обслужил. Без него нельзя
    отличить «не дошло» от «дошло, но проигнорировано»."""
    user = update.effective_user
    who = f"{user.id}" if user else "без автора"
    if update.message:
        kind = "web_app_data" if update.message.web_app_data else "сообщение"
        body = (update.message.web_app_data.data if update.message.web_app_data
                else update.message.text or "<без текста>")
    elif update.callback_query:
        kind, body = "кнопка", update.callback_query.data
    else:
        kind, body = "другое", str(update.to_dict())[:120]
    logger.info(f"Входящее [{kind}] от {who}: {body[:300]}")


# Команды, которые человек печатает руками. Telegram помечает текст командой
# только если знает её из списка команд бота; без этой метки CommandHandler не
# срабатывает и бот молчит. Разбираем текст сами.
PLAIN_TEXT_COMMANDS = {
    "start": "start_command",
    "help": "help_command",
    "timed": "timed_command",
    "day": "day_command",
    "filter": "filter_command",
    "autocollect": "autocollect_command",
    "autocollect_stop": "autocollect_stop_command",
    "stop": "autocollect_stop_command",
    "autocollect_now": "watch_now_command",
    "watch": "watch_now_command",
    "watch_reset": "watch_reset_command",
}


async def plain_text_command_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (update.message.text or "").strip()
    if not text.startswith("/"):
        return
    parts = text.split()
    name = parts[0][1:].split("@")[0].lower()
    target = PLAIN_TEXT_COMMANDS.get(name)
    if not target:
        return
    context.args = parts[1:]
    logger.info(f"Команда без разметки Telegram: {text[:80]}")
    await globals()[target](update, context)


# ==================== СЕРВЕРНЫЙ АВТОСБОРЩИК (BOT-WATCH) ====================

# Поля главного фильтра из приложения, которые понимает bot-watch. Двигатель,
# КПП, привод и состояние сервер не фильтрует - не передаём их вовсе.
WATCH_FILTER_KEYS = (
    "make", "model", "timed", "site", "date",
    "year_from", "year_to", "odometer_from", "odometer_to",
    "fuel", "state", "damage_pr", "damage_exclude", "document"
)


def subscriber_filter(source: Dict[str, Any]) -> Dict[str, str]:
    """Из payload приложения берём только известные bot-watch поля, пустые отбрасываем."""
    clean = {}
    for key in WATCH_FILTER_KEYS:
        value = str(source.get(key, "") or "").strip()
        if value:
            clean[key] = value
    return clean


def describe_subscription(config: Dict[str, Any]) -> str:
    """Подписка одним словом для ответа пользователю."""
    parts = [(config.get("make") or "").strip(), (config.get("model") or "").strip()]
    label = " ".join(p for p in parts if p) or "все лоты"
    if config.get("timed") == "1":
        label += ", только Timed"
    if config.get("site"):
        label += ", площадка " + ("Copart" if config["site"] == "1" else "IAAI")
    if config.get("date"):
        label += f", торги {config['date']}"
    years = [config.get("year_from", ""), config.get("year_to", "")]
    if any(years):
        label += ", годы {}-{}".format(years[0] or "любой", years[1] or "любой")
    return label


def subscriber_watch_params(user_id: int, config: Dict[str, Any]) -> Dict[str, Any]:
    """Параметры bot-watch для подписки: весь главный фильтр, который приложен
    прислал вместе с маркой и моделью. Без timed - смешанная выдача."""
    params = subscriber_filter(config)
    if params.get("timed") not in ("0", "1", "all"):
        params["timed"] = "all"
    params["limit"] = WATCH_DEFAULT_LIMIT
    params["watch_key"] = str(user_id)
    return params


async def watch_now_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Ручной запуск проверки автосборщика bot-watch для текущего пользователя"""
    user_id = update.effective_user.id
    config = DAILY_SUBSCRIBERS.get(user_id)
    if not config:
        await update.message.reply_text(
            "⚠️ У вас нет активной подписки. Запустите через <code>/autocollect [марка] [модель]</code>",
            parse_mode=ParseMode.HTML
        )
        return

    make = config.get("make", "")
    model = config.get("model", "")
    await update.message.reply_text(
        f"🔍 Проверяю свежие поступления bot-watch для <b>{make} {model}</b>...",
        parse_mode=ParseMode.HTML
    )

    params = subscriber_watch_params(user_id, config)
    data = await fetch_bot_watch(params)
    if not data or data.get("status") != "ok":
        reason = (data or {}).get("message", "сервер не ответил")
        await update.message.reply_text(f"❌ <b>bot-watch не ответил</b>: {reason}", parse_mode=ParseMode.HTML)
        return

    count = data.get("count", 0)
    found = data.get("found", 0)
    remembered = data.get("remembered", 0)
    scanned = data.get("scanned", 0)
    server_time = data.get("server_time_utc", "")

    time_formatted = ""
    if server_time:
        try:
            dt = datetime.fromisoformat(server_time.replace("Z", "+00:00"))
            time_formatted = f" (данные от {dt.strftime('%H:%M')} UTC)"
        except Exception:
            pass

    if count == 0:
        if scanned == 0 and (make or model):
            await update.message.reply_text(
                f"⚠️ <b>Источник не вернул ни одного лота по «{make} {model}»</b> (просканировано 0). "
                "Либо таких лотов сейчас нет, либо название модели не совпадает с аукционным: "
                "в источнике это GL-Class, GLE-Class, а не GL.",
                parse_mode=ParseMode.HTML
            )
            return
        await update.message.reply_text(
            f"ℹ️ <b>Новых лотов нет</b> (всего на аукционах: {found}, просканировано: {scanned}, сервер помнит: {remembered}){time_formatted}.\n"
            "Серверная дедупликация активна — бот пришлёт лоты, как только появятся новые.",
            parse_mode=ParseMode.HTML
        )
        return

    lots = data.get("lots", [])
    await update.message.reply_text(
        f"🔔 <b>Найдено {count} новых лотов по подписке «{make} {model}»</b> (из {found} найденных, scanned: {scanned}){time_formatted}:",
        parse_mode=ParseMode.HTML
    )

    for lot in lots:
        caption, keyboard = format_lot_message(lot)
        photo = get_lot_primary_photo(lot)
        try:
            if photo:
                await update.message.reply_photo(
                    photo=photo,
                    caption=caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
            else:
                await update.message.reply_text(
                    caption,
                    parse_mode=ParseMode.HTML,
                    reply_markup=keyboard
                )
        except Exception as e:
            logger.warning(f"Ошибка отправки фото: {e}")
            await update.message.reply_text(caption, parse_mode=ParseMode.HTML, reply_markup=keyboard)
        await asyncio.sleep(0.8)


async def watch_reset_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Сброс истории сервера bot-watch (для тестов)"""
    user_id = update.effective_user.id
    config = DAILY_SUBSCRIBERS.get(user_id, {"make": "Ram", "model": "ProMaster 2500"})
    make = config.get("make", "Ram")
    model = config.get("model", "ProMaster 2500")

    params = {
        "timed": "all",
        "make": make,
        "model": model,
        "limit": WATCH_DEFAULT_LIMIT,
        "watch_key": str(user_id)
    }
    data = await fetch_bot_watch(params, reset=True)
    if data and data.get("status") == "ok":
        await update.message.reply_text(
            f"🔄 <b>Память сервера bot-watch для «{make} {model}» (ключ {user_id}) сброшена!</b>\n"
            "Следующий запрос отдаст все активные лоты заново.",
            parse_mode=ParseMode.HTML
        )
    else:
        await update.message.reply_text("❌ Ошибка при сбросе памяти bot-watch.")


async def daily_auto_collect_job(context: ContextTypes.DEFAULT_TYPE):
    """
    Фоновая задача автосборщика по расписанию (1 раз в 10 минут для тестов / 1 раз в сутки в бою).
    Использует серверный эндпоинт bot-watch.php с серверной дедупликацией.
    """
    if not DAILY_SUBSCRIBERS:
        return

    logger.info(f"Запуск планового прохода автосборщика по {len(DAILY_SUBSCRIBERS)} подписчикам...")
    for user_id, config in list(DAILY_SUBSCRIBERS.items()):
        try:
            make = config.get("make", "")
            model = config.get("model", "")
            params = subscriber_watch_params(user_id, config)
            watch_data = await fetch_bot_watch(params)
            if not watch_data or watch_data.get("status") != "ok":
                continue

            count = watch_data.get("count", 0)
            server_time = watch_data.get("server_time_utc", "")
            remembered = watch_data.get("remembered", 0)
            source = watch_data.get("source", "fresh")
            data_as_of = watch_data.get("data_as_of", "")
            scanned = watch_data.get("scanned", 0)

            logger.info(
                f"Автосборщик [{user_id}] {make} {model}: count={count}, source={source}, "
                f"data_as_of={data_as_of}, remembered={remembered}, scanned={scanned}"
            )

            # Если count == 0 — новых лотов нет, не спамим пользователя
            if count == 0:
                continue

            lots = watch_data.get("lots", [])
            time_formatted = ""
            if server_time:
                try:
                    dt = datetime.fromisoformat(server_time.replace("Z", "+00:00"))
                    time_formatted = f" (данные от {dt.strftime('%H:%M')} UTC)"
                except Exception:
                    pass

            await context.bot.send_message(
                chat_id=user_id,
                text=f"🔔 <b>Автосборщик: {count} новых лотов по подписке «{make} {model}»</b>{time_formatted}:",
                parse_mode=ParseMode.HTML
            )

            for lot in lots:
                caption, keyboard = format_lot_message(lot)
                photo = get_lot_primary_photo(lot)
                try:
                    if photo:
                        await context.bot.send_photo(
                            chat_id=user_id,
                            photo=photo,
                            caption=caption,
                            parse_mode=ParseMode.HTML,
                            reply_markup=keyboard
                        )
                    else:
                        await context.bot.send_message(
                            chat_id=user_id,
                            text=caption,
                            parse_mode=ParseMode.HTML,
                            reply_markup=keyboard
                        )
                except Exception as send_err:
                    logger.warning(f"Ошибка отправки фото автосборщика: {send_err}")
                    await context.bot.send_message(
                        chat_id=user_id,
                        text=caption,
                        parse_mode=ParseMode.HTML,
                        reply_markup=keyboard
                    )
                # Лимит Telegram ~1 сообщение в секунду
                await asyncio.sleep(0.8)

        except Exception as e:
            logger.error(f"Ошибка при обработке подписки пользователя {user_id}: {e}")


def main():
    """Точка входа для запуска бота."""
    # Загружаем сохраненные подписки с диска
    load_subscribers()

    token = TELEGRAM_BOT_TOKEN
    if not token:
        logger.warning(
            "⚠️ ВНИМАНИЕ: Переменная окружения TELEGRAM_BOT_TOKEN не задана!\n"
            "Запустите бота с токеном: TELEGRAM_BOT_TOKEN='ваш_токен' python bot.py"
        )
        token = "DUMMY_TOKEN_PLEASE_SET_TELEGRAM_BOT_TOKEN"

    app = Application.builder().token(token).post_init(open_mini_app_entry).build()

    # Регистрация команд
    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CommandHandler("timed", timed_command))
    app.add_handler(CommandHandler("day", day_command))
    app.add_handler(CommandHandler("filter", filter_command))
    app.add_handler(CommandHandler("autocollect", autocollect_command))
    app.add_handler(CommandHandler("autocollect_stop", autocollect_stop_command))
    app.add_handler(CommandHandler("stop", autocollect_stop_command))
    app.add_handler(CommandHandler("autocollect_now", watch_now_command))
    app.add_handler(CommandHandler("watch", watch_now_command))
    app.add_handler(CommandHandler("watch_reset", watch_reset_command))
    app.add_handler(CallbackQueryHandler(button_callback_handler))
    app.add_handler(MessageHandler(filters.StatusUpdate.WEB_APP_DATA, web_app_data_handler))
    # Команда, которую Telegram не разметил как команду, приходит обычным
    # текстом и до CommandHandler не доходит. Добраливаемся сами.
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, plain_text_command_handler))

    # Второй слой (group=1): пишется по любому входящему апдейту, кроме тех,
    # где есть текст - команды и сообщения видны и здесь.
    app.add_handler(MessageHandler(filters.ALL, log_any_update), group=1)
    app.add_handler(CallbackQueryHandler(log_any_update), group=1)

    # Планировщик автосборщика в фоне процесса (по умолчанию 3600 сек = 1 час)
    if app.job_queue:
        app.job_queue.run_repeating(
            daily_auto_collect_job,
            interval=WATCH_SCHEDULE_INTERVAL_SEC,
            first=15
        )

    logger.info(f"Primebot успешно инициализирован. Интервал автосборщика: {WATCH_SCHEDULE_INTERVAL_SEC}с.")
    if token != "DUMMY_TOKEN_PLEASE_SET_TELEGRAM_BOT_TOKEN":
        app.run_polling()


async def open_mini_app_entry(app: Application):
    """Кнопка меню чата бота (рядом с полем ввода) должна вести в Mini App.
    Без неё приложение открывается вне Telegram и sendData не имеет права
    отправлять сообщения боту."""
    try:
        await app.bot.set_chat_menu_button(menu_button=MenuButtonWebApp(
            text="Автоподбор", web_app=WebAppInfo(url=BOT_APP_URL)
        ))
        logger.info(f"Кнопка меню бота ведёт в Mini App: {BOT_APP_URL}")
    except Exception as e:
        logger.warning(f"Не удалось задать кнопку меню бота: {e}")


if __name__ == "__main__":
    main()
