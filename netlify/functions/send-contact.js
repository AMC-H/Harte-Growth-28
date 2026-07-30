// Netlify Function: ontvangt een bericht via het contactformulier en mailt Harte Growth via Resend.

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

  const { name, email, company, url, message } = data;

  if (data['bot-field']) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }
  if (!name || !email || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'name, email and message required' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_TO_EMAIL || 'alainh1990@gmail.com';
  const FROM = process.env.LEAD_FROM_EMAIL || 'Harte Growth <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'server misconfigured' }) };
  }

  const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:32px 32px 20px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth</div>
          <h1 style="color:#fff;font-size:24px;line-height:1.25;margin:8px 0 4px;font-weight:800;letter-spacing:-.02em;">Nieuw contactbericht</h1>
          <p style="color:#8a8b95;font-size:14px;margin:0 0 22px;">Iemand heeft het contactformulier ingevuld.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-radius:10px;padding:20px 22px;color:#f5f5f7;font-size:15px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#8a8b95;width:110px;">Naam</td><td style="padding:6px 0;font-weight:600;">${escape(name)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a8b95;">E-mail</td><td style="padding:6px 0;"><a href="mailto:${escape(email)}" style="color:#ff4d1a;text-decoration:none;">${escape(email)}</a></td></tr>
            ${company ? `<tr><td style="padding:6px 0;color:#8a8b95;">Bedrijf</td><td style="padding:6px 0;">${escape(company)}</td></tr>` : ''}
            ${url ? `<tr><td style="padding:6px 0;color:#8a8b95;">Website</td><td style="padding:6px 0;"><a href="${escape(url)}" style="color:#ff4d1a;text-decoration:none;">${escape(url)}</a></td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#8a8b95;">Tijdstip</td><td style="padding:6px 0;font-size:13px;color:#8a8b95;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
          </table>

          <div style="margin-top:20px;background:#0f1015;border:1px solid #25262e;border-left:3px solid #ff4d1a;border-radius:10px;padding:20px 22px;">
            <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8b95;letter-spacing:.08em;text-transform:uppercase;margin-bottom:10px;">Bericht</div>
            <div style="color:#f5f5f7;font-size:15px;line-height:1.6;white-space:pre-wrap;">${escape(message)}</div>
          </div>

          <div style="margin-top:24px;">
            <a href="mailto:${escape(email)}?subject=Re:%20je%20bericht%20aan%20Harte%20Growth" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Reageer via e-mail →</a>
          </div>
        </td></tr>
        <tr><td style="padding:14px 32px;background:#0f1015;border-top:1px solid #25262e;color:#565968;font-size:12px;font-family:'SF Mono',Consolas,monospace;">
          Automatische notificatie van hartegrowth.eu/contact
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuw contactbericht

Naam: ${name}
E-mail: ${email}
${company ? 'Bedrijf: ' + company + '\n' : ''}${url ? 'Website: ' + url + '\n' : ''}Tijd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

Bericht:
${message}`;

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
        reply_to: email,
        subject: `Nieuw contactbericht: ${name}${company ? ' (' + company + ')' : ''}`,
        html,
        text
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend contact error', res.status, errText);
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'email send failed' }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-contact exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
