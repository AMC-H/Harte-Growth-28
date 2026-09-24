// Serveert de video's voor /blog als JSON op /api/videos, met cache-headers (6 uur).
// Volgorde: bewaarde data uit Blobs > opnieuw opbouwen (leeg of nieuwe filterregels) > meegeleverde momentopname.
// Er komt nooit een lege lijst of een foutmelding terug.
import { refresh, getStoreSafe, readLatest, writeLatest, publicData, CONFIG_HASH } from './_videos.mjs';
import fallback from './_videos-fallback.mjs';

const HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'public, max-age=21600',
  'Netlify-CDN-Cache-Control': 'public, s-maxage=21600, stale-while-revalidate=86400',
};

export default async () => {
  const store = await getStoreSafe();
  let data = await readLatest(store);
  // leeg, of gefilterd met oudere regels/lijsten (na een deploy): nu opnieuw opbouwen, met de bewaarde pool als basis
  if (!data || !data.items || !data.items.length || data.configHash !== CONFIG_HASH) {
    try {
      data = await refresh(data);
      if (data.items.length) await writeLatest(store, data);
    } catch (e) {
      data = null;
    }
  }
  if (!data || !data.items || !data.items.length) data = fallback;
  return new Response(JSON.stringify(publicData(data)), { status: 200, headers: HEADERS });
};

export const config = { path: '/api/videos' };
