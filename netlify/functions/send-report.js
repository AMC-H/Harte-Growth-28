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

  const { name, email, company, url, scores, avg, findings, verdict } = data;

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

  // Dynamische verdict (komt van frontend, matched wat op de site staat)
  const verdictTitle = (verdict && verdict.head) || `Je scan voor ${domain}`;
  const verdictBody = (verdict && verdict.body) || `Score ${avg}/100.`;
  const ctaMode = (verdict && verdict.ctaMode) || 'fix';
  const ctaLabel = (verdict && verdict.ctaLabel) || 'Plan mijn gesprek';

  // CTA-tekst boven de knoppen past bij de score
  let ctaHead, ctaSub;
  if (ctaMode === 'growth') {
    ctaHead = 'Hoe zien Google, Instagram en TikTok <span style="font-family:\'Georgia\',serif;font-style:italic;color:#ff4d1a;font-weight:400;">jouw markt</span>?';
    ctaSub = 'In 20 minuten hoor je:';
    var ctaBullets = [
      'Waar Google op let bij bedrijven in jouw sector, en waar Instagram en TikTok anders naar kijken',
      'Wat de platforms van jou als ondernemer verwachten om je verder te tonen',
      'Waarom sommige concurrenten meer bereik krijgen ondanks minder content'
    ];
  } else if (ctaMode === 'rebuild') {
    ctaHead = 'Waarom de <span style="font-family:\'Georgia\',serif;font-style:italic;color:#ff4d1a;font-weight:400;">platforms</span> je nu blokkeren.';
    ctaSub = 'In 20 minuten hoor je:';
    var ctaBullets = [
      'Wat Google en de socials zien op deze site en waarom ze je nu op afstand houden',
      'Wat er nodig is om die signalen om te draaien, in de volgorde die werkt',
      'Hoe je onderscheidt wie het écht kan bouwen en wie alleen mooi kan praten'
    ];
  } else {
    ctaHead = 'Wat <span style="font-family:\'Georgia\',serif;font-style:italic;color:#ff4d1a;font-weight:400;">jouw markt</span> nu van je verwacht.';
    ctaSub = 'In 20 minuten hoor je:';
    var ctaBullets = [
      'Welke van deze punten de meeste ranking-invloed heeft voor jouw sector',
      'Welke platforms in jouw markt het meest opleveren (en welke tijd kosten)',
      'Wat je zelf kunt aanpakken zonder tech-kennis, en wat beter uit handen kan'
    ];
  }

  const scoreColor = (s) => s >= 90 ? '#4ade80' : s >= 50 ? '#ffbd2e' : '#ff5c56';
  const scoreRows = scores.map(s => {
    const pct = s.score === null ? 0 : Math.round(s.score * 100);
    return `<tr>
      <td style="padding:10px 0;color:#8a8b95;font-family:'JetBrains Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:.08em;">${escape(s.label)}</td>
      <td style="padding:10px 0;text-align:right;color:${scoreColor(pct)};font-family:'Instrument Serif',Georgia,serif;font-style:italic;font-size:28px;letter-spacing:-.02em;">${pct}<span style="font-size:14px;opacity:.5;">/100</span></td>
    </tr>`;
  }).join('');

  const findingBg = (cls) => cls === 'good' ? 'rgba(74,222,128,.12)' : cls === 'warn' ? 'rgba(255,189,46,.12)' : 'rgba(255,92,86,.12)';
  const findingFg = (cls) => cls === 'good' ? '#4ade80' : cls === 'warn' ? '#ffbd2e' : '#ff5c56';
  const findingBadge = (f) => {
    if(f.value && f.value !== 'ok' && f.value !== 'kan beter' && f.value !== 'fix nodig') return escape(f.value);
    if(f.cls === 'good') return 'ok';
    if(f.cls === 'warn') return 'kan beter';
    return 'fix nodig';
  };

  const findingsHtml = (findings && findings.length) ? `
    <div style="margin-top:8px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8b95;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">Wat we zagen</div>
      ${findings.slice(0, 8).map(f => `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f1015;border:1px solid #25262e;border-radius:10px;margin-bottom:10px;">
          <tr>
            <td width="42" valign="top" style="padding:16px 0 16px 16px;">
              <div style="width:26px;height:26px;border-radius:7px;background:${findingBg(f.cls)};color:${findingFg(f.cls)};text-align:center;line-height:26px;font-family:'JetBrains Mono',monospace;font-weight:700;font-size:13px;">${escape(f.icon)}</div>
            </td>
            <td valign="top" style="padding:14px 16px 14px 12px;">
              <div style="color:#f5f5f7;font-size:15px;font-weight:600;letter-spacing:-.01em;margin-bottom:3px;">${escape(f.label)}</div>
              <div style="color:#8a8b95;font-size:13px;line-height:1.5;">${escape(f.hint)}</div>
            </td>
            <td valign="middle" align="right" style="padding:14px 16px 14px 8px;white-space:nowrap;">
              <span style="display:inline-block;background:#0a0a0c;border:1px solid #25262e;color:#8a8b95;font-family:'JetBrains Mono',monospace;font-size:11.5px;letter-spacing:.02em;padding:6px 12px;border-radius:6px;">${findingBadge(f)}</span>
            </td>
          </tr>
        </table>
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
          <p style="color:#8a8b95;font-size:14.5px;line-height:1.6;margin:0;">Deze scan is uitgevoerd met Google Lighthouse, de officiële audit-tool die Google publiceert voor sites. Getest op mobiel, want dat is Google's ranking-model.</p>
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

        <tr><td style="padding:16px 36px 32px;">
          <div style="background:linear-gradient(135deg,#1f0e08 0%,#0f1015 100%);border:1px solid #ff4d1a;border-radius:14px;padding:30px 28px;">
            <div style="font-family:'Georgia',serif;font-size:12px;color:#ff4d1a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">Volgende stap</div>
            <h3 style="color:#fff;font-size:22px;line-height:1.25;letter-spacing:-.02em;margin:0 0 10px;font-weight:800;">${ctaHead}</h3>
            <p style="color:#c4c6cf;font-size:15px;line-height:1.55;margin:0 0 8px;">${escape(ctaSub)}</p>
            <ul style="color:#a5a7b0;font-size:14px;line-height:1.65;margin:0 0 22px;padding-left:20px;">
              ${ctaBullets.map(b => `<li>${escape(b)}</li>`).join('')}
            </ul>
            <p style="color:#8a8b95;font-size:13px;line-height:1.55;margin:0 0 20px;font-style:italic;">Geen verkoopscript. Geen druk. Ook als we niet gaan samenwerken krijg je bruikbaar advies mee.</p>
            <a href="https://hartegrowth.eu/landing.html#book" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:15px 28px;border-radius:9px;font-weight:700;font-size:15px;letter-spacing:-.01em;margin-right:6px;margin-bottom:8px;">${escape(ctaLabel)} →</a>
            <a href="https://wa.me/31634455762?text=Hoi%20Harte%20Growth%2C%20ik%20heb%20net%20de%20scan%20gedaan%20voor%20${encodeURIComponent(domain)}%20en%20wil%20de%20uitkomsten%20graag%20bespreken." style="display:inline-block;background:transparent;color:#8a8b95;text-decoration:none;padding:15px 22px;border-radius:9px;border:1px solid #25262e;font-weight:500;font-size:14px;">Of direct via WhatsApp</a>
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

Uitgevoerd met Google Lighthouse, Google's officiële audit-tool voor sites. Getest op mobiel.

Scores:
${scores.map(s => `- ${s.label}: ${s.score === null ? 'n.v.t.' : Math.round(s.score*100) + '/100'}`).join('\n')}

Overall: ${avg}/100

${verdictTitle}
${verdictBody}

${ctaSub}
${ctaBullets.map(b => '- ' + b).join('\n')}

Geen verkoopscript. Ook als we niet samenwerken krijg je bruikbaar advies mee.

${ctaLabel}: https://hartegrowth.eu/landing.html#book
Of direct via WhatsApp: https://wa.me/31634455762

Harte Growth
hartegrowth.eu`;

  try {
    // Mail naar klant
    const clientRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [email],
        reply_to: 'hello@hartegrowth.eu',
        subject: `Je groeiscan voor ${domain} · score ${avg}/100`,
        html: clientHtml,
        text: clientText
      })
    });

    if (!clientRes.ok) {
      const errText = await clientRes.text();
      console.error('Resend send-report (client) error', clientRes.status, errText);
    }

    // Aparte, uitgebreidere mail naar Alain met lead-info + scan-scores
    const alainLeadBlock = `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#101014;border:1px solid #25262e;border-left:3px solid #ff4d1a;border-radius:10px;padding:20px 22px;color:#f5f5f7;font-size:15px;line-height:1.6;margin-bottom:24px;">
        <tr><td colspan="2" style="padding-bottom:12px;">
          <div style="font-family:'Georgia',serif;font-size:12px;color:#ff4d1a;letter-spacing:.08em;text-transform:uppercase;">Nieuwe lead</div>
        </td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;width:110px;">Naam</td><td style="padding:6px 0;font-weight:600;">${escape(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;">E-mail</td><td style="padding:6px 0;"><a href="mailto:${escape(email)}" style="color:#ff4d1a;text-decoration:none;">${escape(email)}</a></td></tr>
        ${company ? `<tr><td style="padding:6px 0;color:#8a8b95;">Bedrijf</td><td style="padding:6px 0;">${escape(company)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#8a8b95;">Score</td><td style="padding:6px 0;font-weight:700;color:${avg >= 65 ? '#4ade80' : avg >= 40 ? '#ffbd2e' : '#ff5c56'};">${avg}/100</td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;">Tijdstip</td><td style="padding:6px 0;font-size:13px;color:#8a8b95;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
      </table>`;

    const alainHtml = clientHtml.replace(
      '<tr><td style="padding:36px 36px 24px;">',
      `<tr><td style="padding:32px 36px 8px;">${alainLeadBlock}</td></tr>
       <tr><td style="padding:8px 36px 24px;">`
    );

    const alainRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + RESEND_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM,
        to: [CC],
        reply_to: email,
        subject: `Nieuwe lead: ${name}${company ? ' (' + company + ')' : ''} · ${domain} · ${avg}/100`,
        html: alainHtml,
        text: `Nieuwe lead
Naam: ${name}
Email: ${email}
${company ? 'Bedrijf: ' + company + '\n' : ''}Score: ${avg}/100
Domein: ${domain}
Tijd: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

--- ONDER: de mail die de klant zelf ontving ---

${clientText}`
      })
    });

    if (!alainRes.ok) {
      const errText = await alainRes.text();
      console.error('Resend send-report (alain) error', alainRes.status, errText);
    }

    return { statusCode: 200, headers: cors, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error('send-report exception', err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: err.message }) };
  }
};
