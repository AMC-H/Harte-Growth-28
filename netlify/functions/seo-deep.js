// Netlify Function: diepe SEO-check bovenop de Lighthouse-scan.
// Haalt de URL server-side op en parseert HTML met regex — geen externe API-key nodig.
// Retourneert: title/meta/canonical/hreflang/OG/Twitter/JSON-LD/h1/h2/images/links/words/robots/sitemap.
//
// Bewust regex-only zodat er geen npm-dependencies nodig zijn.

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'method not allowed' }) };
  }

  const raw = event.queryStringParameters && event.queryStringParameters.url;
  if (!raw) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'url parameter required' }) };
  }

  let target;
  try {
    target = new URL(raw);
    if (!/^https?:$/.test(target.protocol)) throw new Error('protocol');
  } catch (_) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid url' }) };
  }

  const UA = 'Mozilla/5.0 (compatible; HarteGrowthScan/1.0; +https://hartegrowth.eu)';
  const timeout = (ms) => new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms));

  async function safeFetch(u, opts = {}, ms = 8000){
    return Promise.race([
      fetch(u, { redirect: 'follow', headers: { 'User-Agent': UA, 'Accept-Language': 'nl,en;q=0.8,es;q=0.6' }, ...opts }),
      timeout(ms)
    ]);
  }

  try {
    // 1. Hoofd-HTML ophalen
    const res = await safeFetch(target.href, {}, 10000);
    if (!res || !res.ok) {
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'fetch_failed', status: res ? res.status : 0 })
      };
    }
    const finalUrl = res.url || target.href;
    const html = (await res.text()).slice(0, 800000); // veiligheidslimiet: 800KB
    const lower = html.toLowerCase();

    // 2. Head-only helpers
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    const head = headMatch ? headMatch[1] : html.slice(0, 200000);

    const attr = (source, tag, attrName, valueAttr = 'content') => {
      // Vindt <tag ... attrName="value" ... valueAttr="wat we willen">
      const re = new RegExp(`<${tag}\\b[^>]*\\b${attrName}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))[^>]*>`, 'gi');
      const matches = [];
      let m;
      while ((m = re.exec(source)) !== null) {
        const nameVal = (m[1] || m[2] || m[3] || '').toLowerCase();
        // Nu binnen dezelfde tag zoeken naar valueAttr
        const full = m[0];
        const vre = new RegExp(`\\b${valueAttr}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i');
        const vm = full.match(vre);
        matches.push({ name: nameVal, value: vm ? (vm[1] || vm[2] || vm[3] || '') : '' });
      }
      return matches;
    };

    // Title
    const titleMatch = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, ' ').trim() : '';

    // Meta tags per name / property
    const metaByName = attr(head, 'meta', 'name');
    const metaByProp = attr(head, 'meta', 'property');
    const findMeta = (key) => {
      const k = key.toLowerCase();
      const a = metaByName.find(m => m.name === k);
      if (a) return a.value;
      const b = metaByProp.find(m => m.name === k);
      return b ? b.value : '';
    };

    const description = findMeta('description');
    const robotsMeta = findMeta('robots');
    const viewport = findMeta('viewport');
    const ogTitle = findMeta('og:title');
    const ogDescription = findMeta('og:description');
    const ogImage = findMeta('og:image');
    const twitterCard = findMeta('twitter:card');

    // Canonical
    const canonicalMatch = head.match(/<link\b[^>]*\brel\s*=\s*["']?canonical["']?[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const canonical = canonicalMatch ? (canonicalMatch[1] || canonicalMatch[2] || canonicalMatch[3] || '') : '';

    // Hreflang
    const hreflangs = [];
    const hreflangRe = /<link\b[^>]*\brel\s*=\s*["']?alternate["']?[^>]*\bhreflang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))[^>]*>/gi;
    let hm;
    while ((hm = hreflangRe.exec(head)) !== null) {
      hreflangs.push((hm[1] || hm[2] || hm[3] || '').toLowerCase());
    }

    // HTML lang
    const langMatch = html.match(/<html\b[^>]*\blang\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const htmlLang = langMatch ? (langMatch[1] || langMatch[2] || langMatch[3] || '') : '';

    // Headings
    const h1s = [];
    let h1m;
    const h1re = /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi;
    while ((h1m = h1re.exec(html)) !== null) {
      const t = h1m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (t) h1s.push(t.slice(0, 200));
    }
    const h2Count = (html.match(/<h2\b[^>]*>/gi) || []).length;
    const h3Count = (html.match(/<h3\b[^>]*>/gi) || []).length;

    // Images: count total + count zonder alt
    let imgTotal = 0;
    let imgNoAlt = 0;
    const imgRe = /<img\b[^>]*>/gi;
    let im;
    while ((im = imgRe.exec(html)) !== null) {
      imgTotal++;
      const tagStr = im[0];
      if (!/\balt\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i.test(tagStr)) {
        imgNoAlt++;
      } else {
        // Alt bestaat maar is leeg? Voor decoratieve iconen is dat prima. We tellen alleen ontbrekend.
      }
    }

    // Links
    let linkInt = 0, linkExt = 0;
    const anchorRe = /<a\b[^>]*\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
    let am;
    const host = target.hostname.replace(/^www\./,'');
    while ((am = anchorRe.exec(html)) !== null) {
      const href = (am[1] || am[2] || am[3] || '').trim();
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
      try {
        const abs = new URL(href, finalUrl);
        const h = abs.hostname.replace(/^www\./,'');
        if (h === host) linkInt++; else linkExt++;
      } catch { /* skip */ }
    }

    // JSON-LD schema types
    const jsonldTypes = [];
    const jsonldRe = /<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let jm;
    while ((jm = jsonldRe.exec(html)) !== null) {
      const raw = jm[1].trim();
      try {
        const parsed = JSON.parse(raw);
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
      } catch { /* skip malformed */ }
    }

    // Word count in body (ruwe schatting: strip scripts + tags)
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

    // HTTPS check
    const isHttps = /^https:$/.test(new URL(finalUrl).protocol);

    // 3. robots.txt + sitemap.xml parallel checken (best-effort)
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
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({
        ok: true,
        url: finalUrl,
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
        imgTotal,
        imgNoAlt,
        linkInt,
        linkExt,
        jsonldTypes,
        wordCount,
        isHttps,
        robotsOk,
        robotsSitemap,
        sitemapOk
      })
    };
  } catch (err) {
    console.error('seo-deep error', err);
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'exception', detail: err.message })
    };
  }
};
