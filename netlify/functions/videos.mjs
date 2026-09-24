// Serveert de video's voor /blog als JSON op /api/videos, met cache-headers (6 uur).
// Volgorde: bewaarde data uit Blobs > live ophalen (eerste keer na een deploy) > meegeleverde momentopname.
// Er komt nooit een lege lijst of een foutmelding terug.
import { refresh, getStoreSafe, readLatest, writeLatest } from './_videos.mjs';
import fallback from './_videos-fallback.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=21600',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
};

export default async () => {
  const store = await getStoreSafe();
  let data = await readLatest(store);
  if (!data || !data.items || !data.items.length) {
    try {
      data = await refresh(null);
      if (data.items.length) await writeLatest(store, data);
    } catch (e) {
      data = null;
    }
  }
  if (!data || !data.items || !data.items.length) data = fallback;
  return new Response(JSON.stringify(data), { status: 200, headers: HEADERS });
};

export const config = { path: '/api/videos' };
