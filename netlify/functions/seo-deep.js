// Netlify Function: diepe SEO-check bovenop de Lighthouse-scan.
// Gebruikt gedeelde parser uit _seo-parse.js — geen externe API-key nodig.

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

  const raw = event.queryStringParameters && event.queryStringParameters.url;
  if (!raw) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'url parameter required' }) };
  }

  try {
    const data = await analyzeSite(raw);
    return {
      statusCode: 200,
      headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' },
      body: JSON.stringify(data)
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
