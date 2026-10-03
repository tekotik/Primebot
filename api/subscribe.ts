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

  try {
    // Тестируемся на staging: в корне прода bot-subscribe.php ещё не лежит.
    // Когда точку поднимем на прод - достаточно задать PRIME_SUBSCRIBE_URL.
    const base = process.env.PRIME_SUBSCRIBE_URL
      || 'https://primeavtoexport.com/staging/api/bot-subscribe.php';

    let target = base;
    let init: RequestInit = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(req.body ?? {}),
    };

    if (req.method === 'GET') {
      // Список подписок читает только воркер: ключ подставляем на сервере,
      // чтобы он не лежал в коде приложения.
      const params = new URLSearchParams(req.url?.split('?')[1] || '');
      params.delete('key');
      params.set('key', process.env.BOT_FEED_KEY || process.env.PRIME_FEED_KEY || '5f17153da0663379d06efa746e2fe65a');
      target = `${base}?${params.toString()}`;
      init = { method: 'GET', headers: { Accept: 'application/json' } };
    }

    const apiRes = await fetch(target, init);
    const data = await apiRes.json().catch(() => ({ status: 'error', message: 'Не JSON в ответе' }));
    res.status(apiRes.status).json(data);
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message || String(err) });
  }
}
