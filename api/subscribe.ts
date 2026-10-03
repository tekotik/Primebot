import type { IncomingMessage, ServerResponse } from 'http';

export const maxDuration = 30;
export const config = { maxDuration: 30 };

interface VercelRequest extends IncomingMessage {
  query: Record<string, string | string[]>;
  body?: any;
  method?: string;
}

interface VercelResponse extends ServerResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: any) => void;
  send: (body: any) => void;
  setHeader: (name: string, value: string | string[]) => this;
}

// Подписка автосборщика идёт мимо Telegram: приложение POSTит сюда, а мы
// пробрасываем на наш PHP, где подпись initData сверяется с токеном бота.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  if (req.method !== 'POST') {
    // Только приём подписки. Список подписок читает воркер напрямую из PHP
    // по ключу: через публичный прокси он утекал бы любому желающему.
    res.status(405).json({ status: 'error', message: 'Метод не поддерживается' });
    return;
  }

  try {
    // Тестируемся на staging: в корне прода bot-subscribe.php ещё не лежит.
    const base = process.env.PRIME_SUBSCRIBE_URL
      || 'https://primeavtoexport.com/staging/api/bot-subscribe.php';

    const apiRes = await fetch(base, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    });
    const data = await apiRes.json().catch(() => ({ status: 'error', message: 'Не JSON в ответе' }));
    res.status(apiRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || String(err) });
  }
}
