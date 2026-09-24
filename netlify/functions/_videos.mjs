// Gedeelde code voor de videostrook op /blog ("Wat verandert er in de algoritmes?").
// Haalt de openbare YouTube RSS-feeds van alleen officiële kanalen op (geen API-key), zonder npm-parser: regex.
// Gebruikt door videos-refresh.mjs (dagelijks, schrijft naar Netlify Blobs) en videos.mjs (serveert de JSON).

// Channel-id's opgezocht via de handle en gecontroleerd (geverifieerd kanaal + werkende feed), september 2026.
export const CHANNELS = [
  { id: 'UCWf2ZlNsCGDS89VBF_awNvA', name: 'Google Search Central', handle: '@GoogleSearchCentral', platform: 'google' },
  { id: 'UCHQU99yKRd_BQVSci2MZ08w', name: 'Instagram', handle: '@instagram', platform: 'instagram' },
  { id: 'UCRQxvznfmSwZmbm5apGhOSg', name: 'Meta for Business', handle: '@FacebookBusiness', platform: 'meta' },
  { id: 'UC1J0_Q_z3zgAJdIheyEbhcg', name: 'TikTok For Business', handle: '@TikTokforBusiness', platform: 'tiktok' },
];

export const PER_PLATFORM = 12; // per platform bewaren, zodat het filter per platform altijd genoeg heeft
const STORE = 'blog-videos';
const KEY = 'latest';

const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .trim();

export function parseFeed(xml, channel) {
  const out = [];
  const entries = xml.split('<entry>').slice(1);
  for (const e of entries) {
    const id = (e.match(/<yt:videoId>([^<]+)<\/yt:videoId>/) || [])[1];
    const title = (e.match(/<title>([\s\S]*?)<\/title>/) || [])[1];
    const published = (e.match(/<published>([^<]+)<\/published>/) || [])[1];
    const thumb = (e.match(/<media:thumbnail url="([^"]+)"/) || [])[1];
    if (!id || !/^[\w-]{11}$/.test(id) || !title || !published) continue;
    // 0 weergaven = aangekondigde livestream of premiere: nog geen thumbnail en niets te zien, overslaan
    const views = (e.match(/<media:statistics views="(\d+)"/) || [])[1];
    if (views === '0') continue;
    out.push({
      videoId: id,
      title: decode(title),
      channel: channel.name,
      channelId: channel.id,
      platform: channel.platform,
      published,
      // alleen de vaste YouTube-thumbnailserver, nooit een url uit de feed ongecontroleerd doorgeven
      thumbnail: thumb && /^https:\/\/i\d?\.ytimg\.com\//.test(thumb) ? thumb : `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  }
  return out;
}

async function fetchFeed(channel) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${channel.id}`, {
      signal: ctrl.signal, headers: { 'User-Agent': 'HarteGrowthBlog/1.0 (+https://hartegrowth.eu/blog)' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseFeed(await res.text(), channel);
    if (!items.length) throw new Error('lege feed');
    return items;
  } finally {
    clearTimeout(t);
  }
}

// Nieuwe data samenvoegen met de vorige: faalt een feed, dan blijven de laatst bekende video's van dat kanaal staan.
export async function refresh(previous) {
  const prevItems = (previous && previous.items) || [];
  const results = await Promise.allSettled(CHANNELS.map(fetchFeed));
  const items = [];
  const status = {};
  results.forEach((r, i) => {
    const ch = CHANNELS[i];
    if (r.status === 'fulfilled') {
      items.push(...r.value.slice(0, PER_PLATFORM));
      status[ch.platform] = 'ok';
    } else {
      items.push(...prevItems.filter((v) => v.channelId === ch.id));
      status[ch.platform] = 'fout: ' + (r.reason && r.reason.message);
    }
  });
  items.sort((a, b) => (a.published < b.published ? 1 : -1));
  const okCount = Object.values(status).filter((s) => s === 'ok').length;
  return { updated: okCount ? new Date().toISOString() : (previous && previous.updated) || null, status, items };
}

export async function getStoreSafe() {
  try {
    const { getStore } = await import('@netlify/blobs');
    return getStore(STORE);
  } catch (e) {
    return null; // buiten Netlify (lokaal) of Blobs niet beschikbaar
  }
}

export async function readLatest(store) {
  if (!store) return null;
  try { return await store.get(KEY, { type: 'json' }); } catch (e) { return null; }
}

export async function writeLatest(store, data) {
  if (!store || !data.items.length) return;
  await store.setJSON(KEY, data);
}
