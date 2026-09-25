// Netlify Function: ontvangt een video-aanvraag (foto's -> video) en mailt Harte Growth via Resend.
// Zelfde patroon als send-contact.js / send-lead.js — gebruikt dezelfde env vars, dus geen
// extra configuratie nodig in Netlify (RESEND_API_KEY / LEAD_TO_EMAIL / LEAD_FROM_EMAIL).

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: cors, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'method not allowed' }) };

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid json' }) };
  }

  const { naam, contact, materiaal, type, aantalFotos, bericht } = data;

  const lang = ['nl', 'en', 'es'].includes(String(data.lang || '').toLowerCase()) ? String(data.lang).toLowerCase() : 'nl';
  const page = typeof data.page === 'string' ? data.page.slice(0, 200) : '';

  if (data['bot-field']) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }
  if (!naam || !contact) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'naam and contact required' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_TO_EMAIL || 'alainh1990@gmail.com';
  const FROM = process.env.LEAD_FROM_EMAIL || 'Harte Growth <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'server misconfigured' }) };
  }

  const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(contact || '').trim());

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f6f1e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e9e1d1;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:32px 32px 20px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth</div>
          <h1 style="color:#17140f;font-size:24px;line-height:1.25;margin:8px 0 4px;font-weight:800;letter-spacing:-.02em;">Nieuwe video-aanvraag</h1>
          <p style="color:#6b6a63;font-size:14px;margin:0 0 22px;">Iemand wil foto's laten omzetten naar een video.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;border:1px solid #e9e1d1;border-radius:10px;padding:20px 22px;color:#17140f;font-size:15px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#6b6a63;width:130px;">Naam</td><td style="padding:6px 0;font-weight:600;">${escape(naam)}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a63;">WhatsApp / e-mail</td><td style="padding:6px 0;">${escape(contact)}</td></tr>
            ${materiaal ? `<tr><td style="padding:6px 0;color:#6b6a63;">Wat stuurt hij/zij</td><td style="padding:6px 0;">${escape(materiaal)}</td></tr>` : ''}
            ${type ? `<tr><td style="padding:6px 0;color:#6b6a63;">Waar van</td><td style="padding:6px 0;">${escape(type)}</td></tr>` : ''}
            ${aantalFotos ? `<tr><td style="padding:6px 0;color:#6b6a63;">Hoeveelheid</td><td style="padding:6px 0;">${escape(aantalFotos)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#6b6a63;">Taal</td><td style="padding:6px 0;">${lang.toUpperCase()}${page ? ' · ' + escape(page) : ''}</td></tr>
            <tr><td style="padding:6px 0;color:#6b6a63;">Tijdstip</td><td style="padding:6px 0;font-size:13px;color:#6b6a63;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
          </table>

          ${bericht ? `<div style="margin-top:20px;background:#fff6f0;border:1px solid #e9e1d1;border-left:3px solid #ff4d1a;border-radius:10px;padding:20px 22px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6a63;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;">Opmerking</div>
            <div style="color:#17140f;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escape(bericht)}</div>
          </div>` : ''}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuwe video-aanvraag

Naam: ${naam}
WhatsApp/e-mail: ${contact}
${materiaal ? 'Wat stuurt hij/zij: ' + materiaal + '\n' : ''}${type ? 'Waar van: ' + type + '\n' : ''}${aantalFotos ? 'Hoeveelheid: ' + aantalFotos + '\n' : ''}Tijd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}
${bericht ? '\nOpmerking:\n' + bericht : ''}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [TO],
        ...(looksLikeEmail ? { reply_to: contact } : {}),
        subject: `${lang !== 'nl' ? '[' + lang.toUpperCase() + '] ' : ''}Nieuwe video-aanvraag: ${naam}`,
        html,
        text
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend video-lead error', res.status, errText);
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'email send failed' }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-video-lead exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
