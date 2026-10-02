import type { IncomingMessage, ServerResponse } from 'http';

// Vercel Serverless Function timeout configuration (up to 60s for external API batch scans)
export const maxDuration = 60;
export const config = {
  maxDuration: 60,
};

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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).send('OK');
    return;
  }

  try {
    const isStaging = process.env.PRIME_ENV === 'staging';
    const defaultBase = isStaging
      ? 'https://primeavtoexport.com/staging/api/bot-watch.php'
      : 'https://primeavtoexport.com/api/bot-watch.php';

    const baseUrl = process.env.PRIME_WATCH_URL || defaultBase;
    const BOT_FEED_KEY =
      process.env.BOT_FEED_KEY ||
      process.env.PRIME_FEED_KEY ||
      '5f17153da0663379d06efa746e2fe65a';

    // Parse query params from request
    const urlObj = new URL(req.url || '', 'https://localhost');
    const params = new URLSearchParams(urlObj.search);

    // Strictly inject the secure backend key on server side
    params.set('key', BOT_FEED_KEY);

    const targetUrl = `${baseUrl}?${params.toString()}`;

    const apiRes = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'PrimeBot-VercelWatchProxy/1.0',
        Accept: 'application/json',
      },
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({
        status: 'error',
        message: `Upstream bot-watch.php error with status ${apiRes.status}`,
      });
    }

    const data = await apiRes.json();
    return res.status(200).json(data);
  } catch (error: any) {
    return res.status(500).json({
      status: 'error',
      message: error?.message || 'Internal proxy error',
    });
  }
}
