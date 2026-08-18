// Gedeelde HTML-parser voor seo-deep + competitor-scan.
// Geen npm-dependencies: pure fetch + regex.

const UA = 'Mozilla/5.0 (compatible; HarteGrowthScan/1.0; +https://hartegrowth.eu)';

function timeout(ms) {
  return new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));
}

async function safeFetch(u, opts = {}, ms = 10000) {
  return Promise.race([
    fetch(u, {
      redirect: 'follow',
      headers: { 'User-Agent': UA, 'Accept-Language': 'nl,en;q=0.8,es;q=0.6' },
      ...opts
    }),
    timeout(ms)
  ]);
}

async function analyzeSite(rawUrl) {
  let target;
  try {
    target = new URL(rawUrl);
    if (!/^https?:$/.test(target.protocol)) throw new Error('protocol');
  } catch (_) {
    return { error: 'invalid_url', input: rawUrl };
  }

  let res;
  try {
    res = await safeFetch(target.href, {}, 10000);
  } catch (err) {
    return { error: 'fetch_failed', detail: err.message, input: rawUrl };
  }
  if (!res || !res.ok) {
    return { error: 'fetch_failed', status: res ? res.status : 0, input: rawUrl };
  }

  const finalUrl = res.url || target.href;
  const html = (await res.text()).slice(0, 800000);

  // === Parsing ===
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const head = headMatch ? headMatch[1] : html.slice(0, 200000);

  const findMetaByAttr = (attrName, key) => {
    const re = new RegExp(`<meta\\b[^>]*\\b${attrName}\\s*=\\s*(?:"${escapeRegex(key)}"|'${escapeRegex(key)}')[^>]*>`, 'i');
    const m = head.match(re);
    if (!m) return '';
    const c = m[0].match(/\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    return c ? (c[1] || c[2] || c[3] || '') : '';
  };

  function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

  const description = findMetaByAttr('name', 'description');
  const robotsMeta  = findMetaByAttr('name', 'robots');
  const viewport    = findMetaByAttr('name', 'viewport');
  const ogTitle     = findMetaByAttr('property', 'og:title');
  const ogDescription = findMetaByAttr('property', 'og:description');
  const ogImage     = findMetaByAttr('property', 'og:image');
  const twitterCard = findMetaByAttr('name', 'twitter:card');

  const canonicalMatch = head.match(/<link\b[^>]*\brel\s*=\s*["']?canonical["']?[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const canonical = canonicalMatch ? (canonicalMatch[1] || canonicalMatch[2] || canonicalMatch[3] || '') : '';

  const hreflangs = [];
  const hreflangRe = /<link\b[^>]*\brel\s*=\s*["']?alternate["']?[^>]*\bhreflang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi;
  let hm;
  while ((hm = hreflangRe.exec(head)) !== null) {
    hreflangs.push((hm[1] || hm[2] || hm[3] || '').toLowerCase());
  }

  const langMatch = html.match(/<html\b[^>]*\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  const htmlLang = langMatch ? (langMatch[1] || langMatch[2] || langMatch[3] || '') : '';

  const h1s = [];
  let h1m;
  const h1re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
  while ((h1m = h1re.exec(html)) !== null) {
    const t = h1m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t) h1s.push(t.slice(0, 200));
  }
  const h2Count = (html.match(/<h2\b[^>]*>/gi) || []).length;
  const h3Count = (html.match(/<h3\b[^>]*>/gi) || []).length;

  const h2Texts = [];
  const h2re = /<h2\b[^>]*>([\s\S]*?)<\/h2>/gi;
  let h2m;
  while ((h2m = h2re.exec(html)) !== null) {
    const t = h2m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (t) h2Texts.push(t.slice(0, 120));
  }

  let imgTotal = 0, imgNoAlt = 0;
  const imgRe = /<img\b[^>]*>/gi;
  let im;
  while ((im = imgRe.exec(html)) !== null) {
    imgTotal++;
    if (!/\balt\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(im[0])) imgNoAlt++;
  }

  let linkInt = 0, linkExt = 0;
  const anchorRe = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let am;
  const host = target.hostname.replace(/^www\./, '');
  while ((am = anchorRe.exec(html)) !== null) {
    const href = (am[1] || am[2] || am[3] || '').trim();
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    try {
      const abs = new URL(href, finalUrl);
      const h = abs.hostname.replace(/^www\./, '');
      if (h === host) linkInt++; else linkExt++;
    } catch { /* skip */ }
  }

  const jsonldTypes = [];
  const jsonldRe = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let jm;
  while ((jm = jsonldRe.exec(html)) !== null) {
    try {
      const parsed = JSON.parse(jm[1].trim());
      const collectTypes = (obj) => {
        if (!obj) return;
        if (Array.isArray(obj)) { obj.forEach(collectTypes); return; }
        if (typeof obj === 'object') {
          if (obj['@type']) {
            const t = obj['@type'];
            if (Array.isArray(t)) t.forEach(x => jsonldTypes.push(String(x)));
            else jsonldTypes.push(String(t));
          }
          if (obj['@graph']) collectTypes(obj['@graph']);
        }
      };
      collectTypes(parsed);
    } catch { /* skip */ }
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  let bodyText = bodyMatch ? bodyMatch[1] : html;
  bodyText = bodyText
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = bodyText ? bodyText.split(/\s+/).filter(Boolean).length : 0;

  const isHttps = /^https:$/.test(new URL(finalUrl).protocol);

  // robots + sitemap best-effort
  const origin = new URL(finalUrl).origin;
  const [robotsRes, sitemapRes] = await Promise.all([
    safeFetch(origin + '/robots.txt', {}, 4000).catch(() => null),
    safeFetch(origin + '/sitemap.xml', { method: 'HEAD' }, 4000).catch(() => null)
  ]);
  const robotsOk = !!(robotsRes && robotsRes.ok);
  let robotsSitemap = '';
  if (robotsOk) {
    try {
      const txt = (await robotsRes.text()).slice(0, 20000);
      const sm = txt.match(/^\s*sitemap:\s*(.+)$/im);
      if (sm) robotsSitemap = sm[1].trim();
    } catch {}
  }
  const sitemapOk = !!(sitemapRes && sitemapRes.ok);

  return {
    ok: true,
    url: finalUrl,
    host,
    title,
    titleLen: title.length,
    description,
    descLen: description.length,
    canonical,
    canonicalOk: !!canonical,
    robotsMeta,
    viewport,
    htmlLang,
    hreflangs,
    hreflangCount: hreflangs.length,
    ogTitle,
    ogDescription,
    ogImage,
    ogOk: !!(ogTitle && ogDescription && ogImage),
    twitterCard,
    h1Count: h1s.length,
    h1First: h1s[0] || '',
    h2Count,
    h3Count,
    h2Texts: h2Texts.slice(0, 20),
    imgTotal,
    imgNoAlt,
    linkInt,
    linkExt,
    jsonldTypes,
    wordCount,
    isHttps,
    robotsOk,
    robotsSitemap,
    sitemapOk,
    htmlSize: html.length
  };
}

module.exports = { analyzeSite, safeFetch };
