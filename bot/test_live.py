import os
import urllib.request
import urllib.parse
import json
import time
from datetime import datetime, timezone

API_BASE_URL = os.getenv("PRIME_FEED_URL", "https://primeavtoexport.com/api/bot-feed.php")
API_STATIC_KEY = os.getenv("BOT_FEED_KEY", "5f17153da0663379d06efa746e2fe65a")

def fetch_feed(params):
    params["key"] = API_STATIC_KEY
    query = "&".join(["%s=%s" % (k, urllib.parse.quote(str(v))) for k, v in params.items()])
    url = API_BASE_URL + "?" + query
    req = urllib.request.Request(url, headers={"User-Agent": "PrimeBot-Acceptance/1.0", "Accept": "application/json"})
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    dt = time.time() - t0
    return dt, data

def calculate_live_countdown(lot):
    is_timed = lot.get("is_timed", False)
    countdown = lot.get("countdown") or {}
    close_utc_str = countdown.get("close_utc") or lot.get("bid_close_date")

    if not close_utc_str:
        if is_timed:
            return countdown.get("text_hours") or "время уточняется"
        return countdown.get("text_days") or lot.get("auction_date", "дата уточняется")

    try:
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
            return "%dч %02dм" % (total_hours, minutes)
        else:
            days = diff.days
            hours = (diff.seconds // 3600)
            if days > 0:
                return "%dд %dч" % (days, hours)
            return "%dч %02dм" % (hours, minutes)
    except Exception as e:
        return str(e)

def format_bid(b):
    if b is not None and isinstance(b, (int, float)) and b > 0:
        return "${:,}".format(int(b)).replace(",", " ")
    return "нет ставок"

print("=== ПРИЁМКА: 1. timed=all&limit=10 ===")
dt1, res1 = fetch_feed({"timed": "all", "limit": 10})
lots1 = res1.get("lots", [])
platforms1 = list(set(l.get("platform") for l in lots1))
print("Секунды: %.2f | Лотов: %d | Площадки: %s | Server Time: %s" % (
    dt1, len(lots1), ", ".join(platforms1) if platforms1 else "нет", res1.get("server_time_utc", "")
))
for l in lots1[:3]:
    cd = calculate_live_countdown(l)
    print("  • Лот #%s: %s %s %s | Площадка: %s | Ставка: %s | Фото: %d шт. | Закрытие: %s" % (
        l.get("lot_id"), l.get("year"), l.get("make"), l.get("model"), l.get("platform"), format_bid(l.get("current_bid")), len(l.get("photos", [])), cd
    ))

print("\n=== ПРИЁМКА: 2. timed=0&date=2026-10-05&site=1&limit=10 ===")
dt2, res2 = fetch_feed({"timed": 0, "date": "2026-10-05", "site": 1, "limit": 10})
lots2 = res2.get("lots", [])
platforms2 = list(set(l.get("platform") for l in lots2))
print("Секунды: %.2f | Лотов: %d | Площадки: %s | Server Time: %s" % (
    dt2, len(lots2), ", ".join(platforms2) if platforms2 else "нет", res2.get("server_time_utc", "")
))
for l in lots2[:3]:
    cd = calculate_live_countdown(l)
    print("  • Лот #%s: %s %s %s | Площадка: %s | Ставка: %s | Фото: %d шт. | Дата: %s" % (
        l.get("lot_id"), l.get("year"), l.get("make"), l.get("model"), l.get("platform"), format_bid(l.get("current_bid")), len(l.get("photos", [])), cd
    ))

print("\n=== ПРИЁМКА: 3. timed=1&make=RAM&model=ProMaster 2500&limit=10 ===")
dt3, res3 = fetch_feed({"timed": 1, "make": "RAM", "model": "ProMaster 2500", "limit": 10})
lots3 = res3.get("lots", [])
platforms3 = list(set(l.get("platform") for l in lots3))
print("Секунды: %.2f | Лотов: %d | Площадки: %s | Server Time: %s" % (
    dt3, len(lots3), ", ".join(platforms3) if platforms3 else "нет", res3.get("server_time_utc", "")
))
for l in lots3:
    cd = calculate_live_countdown(l)
    print("  • Лот #%s: %s %s %s | Площадка: %s | Ставка: %s | Фото: %d шт. | До закрытия: %s" % (
        l.get("lot_id"), l.get("year"), l.get("make"), l.get("model"), l.get("platform"), format_bid(l.get("current_bid")), len(l.get("photos", [])), cd
    ))
