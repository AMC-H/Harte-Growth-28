// Netlify Function: stuurt na een voltooide scan een rapport-mail naar de klant + kopie met scores naar Alain.
// Aangeroepen door de frontend na renderResults met de scan-scores.

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

  const { name, email, company, url, scores, avg, findings } = data;

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'valid email required' }) };
  }
  if (!Array.isArray(scores) || scores.length === 0) {
    return { statusCode: 400, headers: cors, body: JSON.stringify({ error: 'scores required' }) };
  }

  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const CC = process.env.LEAD_TO_EMAIL || 'alainh1990@gmail.com';
  const FROM = process.env.LEAD_FROM_EMAIL || 'Harte Growth <onboarding@resend.dev>';

  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: 'server misconfigured' }) };
  }

  const escape = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const domain = (() => { try { return new URL(url).host.replace(/^www\./, ''); } catch (_) { return url || ''; } })();
  const firstName = (name || '').split(' ')[0] || 'daar';

  // Verdict-tekst gelijk aan wat de site toont
  let verdictTitle, verdictBody;
  if (avg >= 85) {
    verdictTitle = `${domain} staat er sterk voor.`;
    verdictBody = `Score ${avg}/100. Weinig laaghangend fruit meer. Wat wij zouden doen: focus verleggen naar content en zichtbaarheid buiten je eigen site (links, reviews, lokale rankings, ads op koopintentie).`;
  } else if (avg >= 65) {
    verdictTitle = `Redelijk fundament, ruimte om te winnen.`;
    verdictBody = `Score ${avg}/100. De basis staat, maar er zit rek in. Onze inschatting: 2 tot 4 gerichte fixes brengen je naar 85+, en dat merkt Google.`;
  } else if (avg >= 40) {
    verdictTitle = `Er lekt meer dan je denkt.`;
    verdictBody = `Score ${avg}/100. Je site werkt technisch, maar Google en bezoekers krijgen niet wat ze nodig hebben. Meestal binnen 2 tot 3 weken te fixen zonder complete herbouw.`;
  } else {
    verdictTitle = `Deze site kost je nu omzet.`;
    verdictBody = `Score ${avg}/100. Fundamentele issues met SEO, snelheid of mobiel. In deze staat is elke euro die je nu aan ads besteedt half weggegooid.`;
  }

  const scoreColor = (s) => s >= 90 ? '#4ade80' : s >= 50 ? '#ffbd2e' : '#ff5c56';
  const scoreRows = scores.map(s => {
    const pct = s.score === null ? 0 : Math.round(s.score * 100);
    return `<tr>
      <td style="padding:10px 0;color:#8a8b95;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">${escape(s.label)}</td>
      <td style="padding:10px 0;text-align:right;color:${scoreColor(pct)};font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:28px;letter-spacing:-.02em;">${pct}<span style="font-size:14px;opacity:.5;">/100</span></td>
    </tr>`;
  }).join('');

  const findingsHtml = (findings && findings.length) ? `
    <div style="margin-top:24px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8b95;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">Wat we zagen</div>
      ${findings.slice(0, 6).map(f => `
        <div style="padding:12px 0;border-top:1px solid #25262e;">
          <div style="color:#f5f5f7;font-size:14.5px;font-weight:600;margin-bottom:2px;">
            <span style="color:${f.cls === 'good' ? '#4ade80' : f.cls === 'warn' ? '#ffbd2e' : '#ff5c56'};margin-right:6px;">${escape(f.icon)}</span>${escape(f.label)}
          </div>
          <div style="color:#8a8b95;font-size:13px;line-height:1.5;">${escape(f.hint)}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const clientHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:36px 36px 24px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth · Groeiscan</div>
          <h1 style="color:#fff;font-size:26px;line-height:1.2;margin:10px 0 6px;font-weight:800;letter-spacing:-.03em;">Hoi ${escape(firstName)},<br>hier je scan voor <span style="font-family:'Georgia',serif;font-style:italic;color:#ff4d1a;font-weight:400;">${escape(domain)}</span></h1>
          <p style="color:#8a8b95;font-size:14.5px;line-height:1.6;margin:0;">Deze scan is uitgevoerd met Google Lighthouse, dezelfde technologie die Google zelf gebruikt om je site te beoordelen.</p>
        </td></tr>

        <tr><td style="padding:0 36px 24px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-radius:12px;padding:22px 26px;">
            ${scoreRows}
          </table>
        </td></tr>

        <tr><td style="padding:0 36px 24px;">
          <div style="background:#0f1015;border:1px solid #25262e;border-left:3px solid #ff4d1a;border-radius:10px;padding:22px 24px;">
            <h2 style="color:#fff;font-size:20px;letter-spacing:-.02em;margin:0 0 8px;font-weight:700;">${escape(verdictTitle)}</h2>
            <p style="color:#a5a7b0;font-size:14.5px;line-height:1.6;margin:0;">${escape(verdictBody)}</p>
          </div>
        </td></tr>

        ${findingsHtml ? `<tr><td style="padding:0 36px 24px;">${findingsHtml}</td></tr>` : ''}

        <tr><td style="padding:8px 36px 32px;">
          <div style="background:linear-gradient(135deg,#1a0f0a 0%,#0f1015 100%);border:1px solid #ff4d1a;border-radius:12px;padding:24px 26px;">
            <h3 style="color:#fff;font-size:18px;letter-spacing:-.02em;margin:0 0 6px;">Wil je deze uitkomsten samen doornemen?</h3>
            <p style="color:#a5a7b0;font-size:14px;line-height:1.55;margin:0 0 18px;">In 20 minuten prioriteren we de fixes en zeggen we wat we zelf zouden aanpakken (en wat je zelf makkelijk kunt). Zonder verplichting.</p>
            <a href="https://hartegrowth.eu/landing.html#book" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:13px 24px;border-radius:8px;font-weight:600;font-size:14.5px;margin-right:8px;margin-bottom:8px;">Plan direct een gesprek →</a>
            <a href="https://wa.me/31634455762?text=Hoi%20Harte%20Growth%2C%20ik%20heb%20net%20de%20scan%20gedaan%20voor%20${encodeURIComponent(domain)}%20en%20wil%20de%20uitkomsten%20graag%20bespreken." style="display:inline-block;background:transparent;color:#8a8b95;text-decoration:none;padding:13px 20px;border-radius:8px;border:1px solid #25262e;font-weight:500;font-size:14px;">Of app via WhatsApp</a>
          </div>
        </td></tr>

        <tr><td style="padding:16px 36px;background:#0f1015;border-top:1px solid #25262e;color:#565968;font-size:12px;font-family:'SF Mono',Consolas,monospace;">
          Harte Growth · <a href="https://hartegrowth.eu" style="color:#8a8b95;text-decoration:none;">hartegrowth.eu</a> · Nederland &amp; Costa Blanca
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const clientText = `Hoi ${firstName},

Hier je groeiscan voor ${domain}.

Uitgevoerd met Google Lighthouse (dezelfde technologie die Google zelf gebruikt).

Scores:
${scores.map(s => `- ${s.label}: ${s.score === null ? 'n.v.t.' : Math.round(s.score*100) + '/100'}`).join('\n')}

Overall: ${avg}/100

${verdictTitle}
${verdictBody}

Wil je deze uitkomsten samen doornemen in 20 minuten?
- Plan direct een gesprek: https://hartegrowth.eu/landing.html#book
- Of app via WhatsApp: https://wa.me/31634455762

Harte Growth
hartegrowth.eu`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        cc: [CC],
        reply_to: 'hello@hartegrowth.eu',
        subject: `Je groeiscan voor ${domain} · score ${avg}/100`,
        html: clientHtml,
        text: clientText
      })
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Resend send-report error', res.status, errText);
      return { statusCode: 502, headers: cors, body: JSON.stringify({ error: 'send failed', detail: errText }) };
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-report exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
