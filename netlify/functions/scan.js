// Netlify Function: proxy naar Google PageSpeed Insights API.
// API-key blijft server-side in env variable, nooit zichtbaar in publieke JavaScript.
//
// Env variable (in te stellen in Netlify → Environment variables):
//   PAGESPEED_API_KEY   - je Google PageSpeed API-key (AIzaSy...)

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

  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'url parameter required' }) };
  }

  // Basis-validatie: alleen http(s) toestaan
  try {
    const u = new URL(url);
    if (!/^https?:$/.test(u.protocol)) throw new Error('protocol');
  } catch (_) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid url' }) };
  }

  const API_KEY = process.env.PAGESPEED_API_KEY;
  if (!API_KEY) {
    console.error('PAGESPEED_API_KEY not set');
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'server misconfigured' }) };
  }

  const build = (strategy) => `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&category=performance&category=seo&category=accessibility&category=best-practices&strategy=${strategy}&key=${API_KEY}`;

  async function tryScan(strategy){
    const res = await fetch(build(strategy));
    const text = await res.text();
    return { status: res.status, text };
  }

  try {
    // Eerste poging: mobile (Google's ranking-model)
    let r = await tryScan('mobile');

    // Als 500/502/503 van Google's kant: retry met desktop-strategy, soms werkt dat wel
    if (r.status >= 500 && r.status < 600) {
      console.warn('mobile scan failed with', r.status, '- retrying with desktop');
      const desktop = await tryScan('desktop');
      if (desktop.status >= 200 && desktop.status < 300) {
        r = desktop;
      }
    }

    return {
      statusCode: r.status,
      headers: { ...cors, 'Content-Type': 'application/json' },
      body: r.text
    };
  } catch (err) {
    console.error('scan proxy error', err);
    return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'upstream failure', detail: err.message }) };
  }
};
