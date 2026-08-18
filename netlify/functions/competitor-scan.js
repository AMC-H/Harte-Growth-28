// Netlify Function: vergelijkt twee sites naast elkaar.
// Input: ?url=<jouwsite>&competitor=<concurrent>
// Output: { you: {...}, them: {...}, gaps: [...], wins: [...] }

const { analyzeSite } = require('./_seo-parse.js');

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'method not allowed' }) };
  }

  const q = event.queryStringParameters || {};
  if (!q.url || !q.competitor) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'url and competitor required' }) };
  }

  try {
    const [you, them] = await Promise.all([
      analyzeSite(q.url),
      analyzeSite(q.competitor)
    ]);

    if (!you.ok || !them.ok) {
      return {
        statusCode: 200,
        headers: { ...cors, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'one_or_both_failed',
          you: you.ok ? { ok: true, host: you.host } : { ok: false, reason: you.error },
          them: them.ok ? { ok: true, host: them.host } : { ok: false, reason: them.error }
        })
      };
    }

    // Vergelijkings-logica: waar zij beter zijn (gaps) en waar jij wint (wins)
    const gaps = [];
    const wins = [];
    const compareBool = (key, you_val, them_val, label) => {
      if (them_val && !you_val) gaps.push({ key, label, you: 'nee', them: 'ja' });
      else if (you_val && !them_val) wins.push({ key, label, you: 'ja', them: 'nee' });
    };
    const compareNum = (key, you_val, them_val, label, unit = '', tolerance = 0.1) => {
      const diff = them_val - you_val;
      const rel = you_val > 0 ? Math.abs(diff) / you_val : 1;
      if (rel < tolerance) return; // niet significant genoeg
      if (them_val > you_val) gaps.push({ key, label, you: you_val + unit, them: them_val + unit });
      else if (you_val > them_val) wins.push({ key, label, you: you_val + unit, them: them_val + unit });
    };

    compareNum('wordCount', you.wordCount, them.wordCount, 'Content-omvang', ' woorden', 0.2);
    compareNum('h2Count', you.h2Count, them.h2Count, 'Aantal secties (H2)', '', 0.3);
    compareNum('linkInt', you.linkInt, them.linkInt, 'Interne links', '', 0.3);

    compareBool('canonical', you.canonicalOk, them.canonicalOk, 'Canonical URL');
    compareBool('og', you.ogOk, them.ogOk, 'Open Graph (social sharing)');
    compareBool('robots', you.robotsOk, them.robotsOk, 'robots.txt');
    compareBool('sitemap', you.sitemapOk, them.sitemapOk, 'sitemap.xml');
    compareBool('https', you.isHttps, them.isHttps, 'HTTPS');

    // Hreflang: meer talen = meer markten
    if (them.hreflangCount > you.hreflangCount) gaps.push({ key: 'hreflang', label: 'Talen (hreflang)', you: you.hreflangCount, them: them.hreflangCount });
    else if (you.hreflangCount > them.hreflangCount) wins.push({ key: 'hreflang', label: 'Talen (hreflang)', you: you.hreflangCount, them: them.hreflangCount });

    // JSON-LD: types
    const yourTypes = new Set(you.jsonldTypes || []);
    const theirTypes = new Set(them.jsonldTypes || []);
    const theyHave = [...theirTypes].filter(t => !yourTypes.has(t));
    const youHave = [...yourTypes].filter(t => !theirTypes.has(t));
    if (theyHave.length) gaps.push({ key: 'jsonld', label: 'Structured data types', you: [...yourTypes].join(', ') || '—', them: [...theirTypes].join(', ') || '—', extra: `Zij hebben extra: ${theyHave.join(', ')}` });
    if (youHave.length && !theyHave.length) wins.push({ key: 'jsonld', label: 'Structured data types', you: [...yourTypes].join(', ') || '—', them: [...theirTypes].join(', ') || '—' });

    // Titel / meta
    const titleOk = (s) => s.title && s.titleLen >= 30 && s.titleLen <= 60;
    const descOk = (s) => s.description && s.descLen >= 80 && s.descLen <= 170;
    compareBool('titleQuality', titleOk(you), titleOk(them), 'Titel-lengte optimaal (30–60)');
    compareBool('descQuality', descOk(you), descOk(them), 'Meta-beschrijving optimaal (80–170)');

    // Images
    if (them.imgTotal > 0 && you.imgTotal > 0) {
      const youNoAltPct = you.imgNoAlt / you.imgTotal;
      const themNoAltPct = them.imgNoAlt / them.imgTotal;
      if (youNoAltPct > themNoAltPct + 0.15) {
        gaps.push({ key: 'imgAlt', label: 'Image alt-teksten', you: you.imgNoAlt + '/' + you.imgTotal + ' zonder alt', them: them.imgNoAlt + '/' + them.imgTotal + ' zonder alt' });
      } else if (themNoAltPct > youNoAltPct + 0.15) {
        wins.push({ key: 'imgAlt', label: 'Image alt-teksten', you: you.imgNoAlt + '/' + you.imgTotal + ' zonder alt', them: them.imgNoAlt + '/' + them.imgTotal + ' zonder alt' });
      }
    }

    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify({
        ok: true,
        you: pubFields(you),
        them: pubFields(them),
        gaps,
        wins
      })
    };
  } catch (err) {
    console.error('competitor-scan error', err);
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'exception', detail: err.message })
    };
  }
};

// Publieke velden — beperkte set om response klein te houden
function pubFields(s) {
  return {
    host: s.host,
    url: s.url,
    title: s.title,
    titleLen: s.titleLen,
    description: s.description,
    descLen: s.descLen,
    canonicalOk: s.canonicalOk,
    hreflangCount: s.hreflangCount,
    hreflangs: s.hreflangs,
    ogOk: s.ogOk,
    jsonldTypes: s.jsonldTypes,
    h1First: s.h1First,
    h1Count: s.h1Count,
    h2Count: s.h2Count,
    h3Count: s.h3Count,
    imgTotal: s.imgTotal,
    imgNoAlt: s.imgNoAlt,
    linkInt: s.linkInt,
    linkExt: s.linkExt,
    wordCount: s.wordCount,
    isHttps: s.isHttps,
    robotsOk: s.robotsOk,
    sitemapOk: s.sitemapOk
  };
}
