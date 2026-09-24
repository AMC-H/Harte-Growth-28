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

export const PER_PLATFORM = 12; // per platform tonen/bewaren na het filter
const POOL = 30;                  // per kanaal de laatste 30 ruwe video's bewaren (de feed geeft er 15; de pool groeit per dag)
const FILTER_VERSION = 2;         // ophogen als de filterregels veranderen: dan wordt direct opnieuw gefilterd

// Handmatige lijsten (zie data/*.json). Worden meegebundeld; een wijziging werkt na de volgende deploy.
import excludeList from '../../data/videos-exclude.json' with { type: 'json' };
import includeList from '../../data/videos-include.json' with { type: 'json' };
const EXCLUDE = new Set((excludeList.videoIds || []).filter((id) => /^[\w-]{11}$/.test(id)));
const INCLUDE = (includeList.videos || []).filter((v) => v && /^[\w-]{11}$/.test(v.videoId));
export const CONFIG_HASH = FILTER_VERSION + ':' + JSON.stringify([...EXCLUDE].sort()) + ':' + JSON.stringify(INCLUDE);

/* ---------- Relevantiefilter ---------- */
const TERMS = ['algorithm', 'ranking', 'update', 'core update', 'search', 'SEO', 'AI Mode', 'AI Overviews', 'Search Console',
  'Office Hours', 'reach', 'recommendations', 'Reels', 'Mosseri', 'creators', 'tips', 'how to grow', 'ads', 'Advantage+',
  'insights', 'analytics', 'Business', 'algoritme'];
const reEsc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const TERM_RE = TERMS.map((t) => ({ t: t.toLowerCase(), re: new RegExp('(?<![\\p{L}\\p{N}])' + reEsc(t) + (t.endsWith('+') ? '' : 's?') + '(?![\\p{L}\\p{N}])', 'iu') }));
// titels met deze woorden alleen tonen als de titel zelf ook een relevante term bevat
const SOFT_BLOCK = /close friends only|(?<![\p{L}])talks?(?![\p{L}])|fashion|#shorts/iu;
// altijd weg: entertainmentreeks van Instagram (titels bevatten "Algorithm", maar gaan over de feed van een beroemdheid)
const HARD_BLOCK = /algo confessions/i;
// livestream-aankondigingen zonder inhoud
const LIVE = /(?<![\p{L}])(live ?stream|premieres?|coming soon|going live|live now|starting soon)(?![\p{L}])/iu;
// Office Hours alleen in het Engels
const OTHER_LANG = /(español|espanol|português|portugues|deutsch|français|francais|italiano|bahasa|türkçe|turkce|polski|japanese|hindi|korean|indonesia|tiếng việt)/i;

function nonLatin(text) {
  for (const ch of text) if (/\p{L}/u.test(ch) && !/\p{Script=Latin}/u.test(ch)) return true;
  return false;
}
function termsIn(text) { return TERM_RE.filter((x) => x.re.test(text)).map((x) => x.t); }

export function relevant(v) {
  const title = v.title || '', desc = v.description || '';
  if (nonLatin(title)) return false;
  if (HARD_BLOCK.test(title)) return false;
  const inTitle = termsIn(title);
  if (SOFT_BLOCK.test(title) && !inTitle.length) return false;
  if (LIVE.test(title) && !inTitle.length) return false;
  let found = [...new Set(inTitle.concat(termsIn(desc)))];
  if (OTHER_LANG.test(title)) found = found.filter((t) => t !== 'office hours');
  return found.length > 0;
}
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
    const desc = (e.match(/<media:description>([\s\S]*?)<\/media:description>/) || [])[1] || '';
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
      description: decode(desc).slice(0, 600),
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

// Handmatig toegevoegde video's: alleen van de officiële kanalen (gecontroleerd via YouTube oEmbed of de pool).
async function includeItems(pool) {
  const out = [];
  for (const inc of INCLUDE) {
    const known = pool.find((v) => v.videoId === inc.videoId);
    if (known) { out.push(known); continue; }
    try {
      const r = await fetch('https://www.youtube.com/oembed?format=json&url=' + encodeURIComponent('https://www.youtube.com/watch?v=' + inc.videoId));
      if (!r.ok) continue;
      const o = await r.json();
      const handle = String(o.author_url || '').split('/').pop().toLowerCase();
      const ch = CHANNELS.find((c) => c.handle.toLowerCase() === handle);
      if (!ch || !/^\d{4}-\d{2}-\d{2}$/.test(inc.date || '')) continue; // ander kanaal of geen datum: negeren
      out.push({ videoId: inc.videoId, title: String(o.title || ''), channel: ch.name, channelId: ch.id, platform: ch.platform,
        published: inc.date + 'T12:00:00+00:00', description: '', thumbnail: `https://i.ytimg.com/vi/${inc.videoId}/hqdefault.jpg` });
    } catch (e) { /* overslaan */ }
  }
  return out;
}

// Nieuwe feeds samenvoegen met de vorige pool: faalt een feed, dan blijven de laatst bekende video's van dat kanaal staan.
export async function refresh(previous) {
  const prevPool = (previous && previous.pool) || (previous && previous.items) || [];
  const results = await Promise.allSettled(CHANNELS.map(fetchFeed));
  const status = {};
  let pool = [];
  results.forEach((r, i) => {
    const ch = CHANNELS[i];
    const old = prevPool.filter((v) => v.channelId === ch.id);
    const fresh = r.status === 'fulfilled' ? r.value : [];
    status[ch.platform] = r.status === 'fulfilled' ? 'ok' : 'fout: ' + (r.reason && r.reason.message);
    const byId = new Map();
    fresh.concat(old).forEach((v) => { if (!byId.has(v.videoId)) byId.set(v.videoId, v); });
    pool.push(...[...byId.values()].sort((a, b) => (a.published < b.published ? 1 : -1)).slice(0, POOL));
  });
  const forced = await includeItems(pool);
  const forcedIds = new Set(forced.map((v) => v.videoId));
  const chosen = pool.filter((v) => !forcedIds.has(v.videoId) && relevant(v)).concat(forced).filter((v) => !EXCLUDE.has(v.videoId));
  const items = [];
  CHANNELS.forEach((ch) => {
    items.push(...chosen.filter((v) => v.platform === ch.platform).sort((a, b) => (a.published < b.published ? 1 : -1)).slice(0, PER_PLATFORM));
  });
  items.sort((a, b) => (a.published < b.published ? 1 : -1));
  const okCount = Object.values(status).filter((x) => x === 'ok').length;
  return {
    updated: okCount ? new Date().toISOString() : (previous && previous.updated) || null,
    configHash: CONFIG_HASH, status,
    items: items.map(({ description, ...v }) => v),  // de strook heeft de beschrijving niet nodig
    pool,
  };
}

// Wat de browser krijgt: zonder de ruwe pool, zonder uitgesloten video's
export function publicData(data) {
  return { updated: data.updated, items: (data.items || []).filter((v) => !EXCLUDE.has(v.videoId)) };
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
