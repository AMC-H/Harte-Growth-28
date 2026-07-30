// Netlify Function: ontvangt een booking (dag + tijd + contact) via de landing-widget en mailt Harte Growth via Resend.

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

  const { name, company, contact, day, time } = data;

  if (data['bot-field']) {
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }
  if (!name || !contact || !day || !time) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'name, contact, day and time required' }) };
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
          <h1 style="color:#fff;font-size:24px;line-height:1.25;margin:8px 0 4px;font-weight:800;letter-spacing:-.02em;">Nieuw groeigesprek gepland</h1>
          <p style="color:#a3a5b0;font-size:14px;margin:0 0 22px;">Iemand heeft een moment gekozen via de landing.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-left:3px solid #ff4d1a;border-radius:10px;padding:20px 22px;color:#f5f5f7;font-size:15px;line-height:1.6;margin-bottom:22px;">
            <tr><td colspan="2" style="padding-bottom:10px;">
              <div style="font-family:'Georgia',serif;font-size:12px;color:#ff4d1a;letter-spacing:.08em;text-transform:uppercase;">Gekozen moment</div>
            </td></tr>
            <tr><td style="padding:6px 0;font-weight:700;font-size:20px;">${escape(day)} · ${escape(time)}</td></tr>
          </table>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-radius:10px;padding:20px 22px;color:#f5f5f7;font-size:15px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#a3a5b0;width:110px;">Naam</td><td style="padding:6px 0;font-weight:600;">${escape(name)}</td></tr>
            ${company ? `<tr><td style="padding:6px 0;color:#a3a5b0;">Bedrijf</td><td style="padding:6px 0;">${escape(company)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#a3a5b0;">Bereikbaar</td><td style="padding:6px 0;">${escape(contact)}</td></tr>
            <tr><td style="padding:6px 0;color:#a3a5b0;">Aangevraagd op</td><td style="padding:6px 0;font-size:13px;color:#a3a5b0;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
          </table>

          <div style="margin-top:22px;padding:14px 18px;background:#1a0f0a;border-left:3px solid #ff4d1a;border-radius:8px;color:#a5a7b0;font-size:13.5px;line-height:1.55;">
            Bevestig het moment bij deze persoon (of stel een alternatief voor als je toch niet kan). Antwoord op deze mail komt direct bij de aanvrager terecht.
          </div>
        </td></tr>
        <tr><td style="padding:14px 32px;background:#0f1015;border-top:1px solid #25262e;color:#6d6f7a;font-size:12px;font-family:'SF Mono',Consolas,monospace;">
          Automatische notificatie van hartegrowth.eu/landing
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuw groeigesprek gepland

Moment: ${day} om ${time}

Naam: ${name}
${company ? 'Bedrijf: ' + company + '\n' : ''}Bereikbaar: ${contact}
Aangevraagd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

Bevestig of stel een alternatief voor. Antwoord op deze mail komt direct bij de aanvrager terecht.`;

  // Reply-to: als contact een e-mail is, gebruik die
  const emailInContact = /[^\s@]+@[^\s@]+\.[^\s@]+/.exec(contact);
  const replyTo = emailInContact ? emailInContact[0] : undefined;

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
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject: `Groeigesprek gepland: ${name} · ${day} ${time}`,
        html,
        text
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend booking error', res.status, errText);
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'email send failed' }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-booking exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
