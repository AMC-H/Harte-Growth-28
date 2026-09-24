// Netlify Scheduled Function: haalt 1x per dag de YouTube-feeds van de officiële kanalen op en bewaart ze in
// Netlify Blobs. Faalt een feed, dan blijven de laatst bekende video's van dat kanaal staan (zie _videos.mjs).
import { refresh, getStoreSafe, readLatest, writeLatest } from './_videos.mjs';

export default async () => {
  const store = await getStoreSafe();
  const previous = await readLatest(store);
  const data = await refresh(previous);
  await writeLatest(store, data);
  console.log('[videos-refresh]', JSON.stringify(data.status), data.items.length, 'video\'s');
  return new Response(null, { status: 204 });
};

export const config = { schedule: '@daily' };
