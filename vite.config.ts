import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function feedProxyPlugin() {
  return {
    name: 'feed-proxy',
    configureServer(server: any) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        if (req.url && req.url.startsWith('/api/feed')) {
          try {
            const BOT_FEED_KEY = process.env.BOT_FEED_KEY || '5f17153da0663379d06efa746e2fe65a';
            const urlObj = new URL(req.url, 'http://localhost');
            const params = new URLSearchParams(urlObj.search);
            params.set('key', BOT_FEED_KEY);
            const isStaging = process.env.PRIME_ENV === 'staging';
            const defaultBase = isStaging
              ? 'https://primeavtoexport.com/staging/api/bot-feed.php'
              : 'https://primeavtoexport.com/api/bot-feed.php';
            const targetUrl = `${defaultBase}?${params.toString()}`;

            const apiRes = await fetch(targetUrl, {
              headers: { 'User-Agent': 'PrimeBot-DevProxy/1.0', 'Accept': 'application/json' },
            });
            const data = await apiRes.text();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = apiRes.status;
            res.end(data);
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), feedProxyPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        '/staging/api': {
          target: 'https://primeavtoexport.com',
          changeOrigin: true,
          secure: false,
        },
        '/api/bot-feed': {
          target: 'https://primeavtoexport.com/staging/api/bot-feed.php',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
