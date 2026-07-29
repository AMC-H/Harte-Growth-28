// Netlify Function: ontvangt scan-lead data en stuurt via Resend een e-mail naar Harte Growth.
// Environment variables (in te stellen in Netlify dashboard → Site settings → Environment variables):
//   RESEND_API_KEY   - je Resend API-key (re_xxxxx)
//   LEAD_TO_EMAIL    - adres waar de notificatie heen moet, bijv. alainh1990@gmail.com
//   LEAD_FROM_EMAIL  - afzender, bijv. "Harte Growth <noreply@hartegrowth.com>" (domein moet in Resend geverifieerd zijn)

exports.handler = async (event) => {
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors, body: '' };
  }
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors, body: JSON.stringify({ error: 'method not allowed' }) };
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'invalid json' }) };
  }

  const { name, email, company, url, consent, referrer } = data;

  // Simple validation + honeypot check
  if (data['bot-field']) {
    // Silent success — bots denken dat het werkt
    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  }
  if (!name || !email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'name and valid email required' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const TO = process.env.LEAD_TO_EMAIL || 'alainh1990@gmail.com';
  const FROM = process.env.LEAD_FROM_EMAIL || 'Harte Growth <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'server misconfigured' }) };
  }

  const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const domain = (() => { try { return new URL(url).host.replace(/^www\./, ''); } catch (_) { return url || ''; } })();

  const html = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:32px 32px 20px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth</div>
          <h1 style="color:#fff;font-size:24px;line-height:1.25;margin:8px 0 4px;font-weight:800;letter-spacing:-.02em;">Nieuwe groeiscan-lead</h1>
          <p style="color:#8a8b95;font-size:14px;margin:0 0 24px;">Iemand heeft net de scan gestart via de site.</p>

          <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-radius:10px;padding:20px 22px;color:#f5f5f7;font-size:15px;line-height:1.6;">
            <tr><td style="padding:6px 0;color:#8a8b95;width:110px;">Naam</td><td style="padding:6px 0;font-weight:600;">${escape(name)}</td></tr>
            <tr><td style="padding:6px 0;color:#8a8b95;">E-mail</td><td style="padding:6px 0;"><a href="mailto:${escape(email)}" style="color:#ff4d1a;text-decoration:none;">${escape(email)}</a></td></tr>
            ${company ? `<tr><td style="padding:6px 0;color:#8a8b95;">Bedrijf</td><td style="padding:6px 0;">${escape(company)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#8a8b95;">Gescande URL</td><td style="padding:6px 0;"><a href="${escape(url)}" style="color:#ff4d1a;text-decoration:none;">${escape(domain)}</a></td></tr>
            <tr><td style="padding:6px 0;color:#8a8b95;">Toestemming</td><td style="padding:6px 0;">${consent ? 'ja' : 'nee'}</td></tr>
            ${referrer ? `<tr><td style="padding:6px 0;color:#8a8b95;">Referrer</td><td style="padding:6px 0;font-size:12px;color:#8a8b95;">${escape(referrer)}</td></tr>` : ''}
            <tr><td style="padding:6px 0;color:#8a8b95;">Tijdstip</td><td style="padding:6px 0;font-size:13px;color:#8a8b95;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
          </table>

          <div style="margin-top:24px;padding:16px 20px;background:#1a0f0a;border-left:3px solid #ff4d1a;border-radius:8px;color:#a5a7b0;font-size:13.5px;line-height:1.55;">
            Tip: pak deze binnen 1 werkdag op. Wie een scan doet is actief aan het vergelijken.
          </div>

          <div style="margin-top:28px;">
            <a href="https://wa.me/${escape(email).replace(/[^\d]/g, '') || '31634455762'}" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Mail direct terug →</a>
          </div>
        </td></tr>
        <tr><td style="padding:14px 32px;background:#0f1015;border-top:1px solid #25262e;color:#565968;font-size:12px;font-family:'SF Mono',Consolas,monospace;">
          Automatische notificatie van hartegrowth.com/groeiscan
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `Nieuwe groeiscan-lead

Naam: ${name}
E-mail: ${email}
${company ? 'Bedrijf: ' + company + '\n' : ''}Gescande URL: ${url}
Toestemming: ${consent ? 'ja' : 'nee'}
${referrer ? 'Referrer: ' + referrer + '\n' : ''}Tijd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

Pak binnen 1 werkdag op — deze lead is actief aan het vergelijken.`;

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
        subject: `Nieuwe groeiscan: ${name}${company ? ' (' + company + ')' : ''} · ${domain}`,
        html,
        text
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend API error', res.status, errText);
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'email send failed', detail: errText }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-lead exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
