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

  const { name, email, company, url, scores, avg, findings, deepFindings, deepSectionLabel, verdict, lang: rawLang } = data;
  const LANG = (['nl','en','es'].includes(rawLang) ? rawLang : 'nl');

  // i18n strings voor mail-framing
  const M = {
    nl: {
      subjectClient: `Je groeiscan voor ${domain(url)} · score ${avg}/100`,
      hi: (n) => `Hoi ${n},`,
      hereReport: (d) => `hier je scan voor ${d}`,
      intro: 'Deze scan is uitgevoerd met Google Lighthouse, de officiële audit-tool die Google publiceert voor sites. Getest op mobiel, want dat is Google’s ranking-model.',
      whatWeSaw: 'Wat we zagen',
      nextStep: 'Volgende stap',
      ctaHead: { growth: 'Hoe zien Google, Instagram en TikTok <em>jouw markt</em>?', rebuild: 'Waarom de <em>platforms</em> je nu blokkeren.', fix: 'Wat <em>jouw markt</em> nu van je verwacht.' },
      ctaSub: 'In 20 minuten hoor je:',
      ctaBullets: {
        growth: ['Waar Google op let bij bedrijven in jouw sector, en waar Instagram en TikTok anders naar kijken','Wat de platforms van jou als ondernemer verwachten om je verder te tonen','Waarom sommige concurrenten meer bereik krijgen ondanks minder content'],
        rebuild: ['Wat Google en de socials zien op deze site en waarom ze je nu op afstand houden','Wat er nodig is om die signalen om te draaien, in de volgorde die werkt','Hoe je onderscheidt wie het écht kan bouwen en wie alleen mooi kan praten'],
        fix: ['Welke van deze punten de meeste ranking-invloed heeft voor jouw sector','Welke platforms in jouw markt het meest opleveren (en welke tijd kosten)','Wat je zelf kunt aanpakken zonder tech-kennis, en wat beter uit handen kan']
      },
      reassure: 'Geen verkoopscript. Geen druk. Ook als we niet gaan samenwerken krijg je bruikbaar advies mee.',
      or: 'Of direct via WhatsApp',
      footer: 'Harte Growth · hartegrowth.eu · Nederland & Costa Blanca',
      newLead: 'Nieuwe lead',
      alainSubject: (n, comp, d, a) => `Nieuwe lead: ${n}${comp ? ' (' + comp + ')' : ''} · ${d} · ${a}/100`,
      labels: { name:'Naam', email:'E-mail', company:'Bedrijf', score:'Score', time:'Tijdstip', receivedByClient:'ONDER: de mail die de klant zelf ontving' }
    },
    en: {
      subjectClient: `Your growth scan for ${domain(url)} · score ${avg}/100`,
      hi: (n) => `Hi ${n},`,
      hereReport: (d) => `here is your scan for ${d}`,
      intro: 'This scan was run with Google Lighthouse, the official audit tool Google publishes for sites. Tested on mobile, which is Google’s ranking model.',
      whatWeSaw: 'What we saw',
      nextStep: 'Next step',
      ctaHead: { growth: 'How do Google, Instagram and TikTok see <em>your market</em>?', rebuild: 'Why the <em>platforms</em> are holding you back.', fix: 'What <em>your market</em> expects from you now.' },
      ctaSub: 'In 20 minutes you will hear:',
      ctaBullets: {
        growth: ['What Google looks at for businesses in your sector, and how Instagram and TikTok evaluate differently','What the platforms expect from you as a founder to show you further','Why some competitors get more reach despite less content'],
        rebuild: ['What Google and the socials see on this site and why they hold you at a distance','What it takes to flip those signals, in the order that works','How to distinguish who can really build it from who only talks well'],
        fix: ['Which of these points has the biggest ranking impact for your sector','Which platforms bring the most in your market (and which cost time)','What you can tackle yourself without tech knowledge, and what is better outsourced']
      },
      reassure: 'No sales script. No pressure. Even if we do not end up working together, you leave with useful advice.',
      or: 'Or direct via WhatsApp',
      footer: 'Harte Growth · hartegrowth.eu · Netherlands & Costa Blanca',
      newLead: 'New lead',
      alainSubject: (n, comp, d, a) => `New lead: ${n}${comp ? ' (' + comp + ')' : ''} · ${d} · ${a}/100`,
      labels: { name:'Name', email:'Email', company:'Company', score:'Score', time:'Time', receivedByClient:'BELOW: the email the client received' }
    },
    es: {
      subjectClient: `Tu escaneo para ${domain(url)} · puntuación ${avg}/100`,
      hi: (n) => `Hola ${n},`,
      hereReport: (d) => `aquí tienes tu escaneo para ${d}`,
      intro: 'Este escaneo se hizo con Google Lighthouse, la herramienta oficial de auditoría que Google publica para sitios. Probado en móvil, porque es el modelo de ranking de Google.',
      whatWeSaw: 'Lo que vimos',
      nextStep: 'Siguiente paso',
      ctaHead: { growth: '¿Cómo ven Google, Instagram y TikTok <em>tu mercado</em>?', rebuild: 'Por qué las <em>plataformas</em> te están bloqueando ahora.', fix: 'Lo que <em>tu mercado</em> espera de ti ahora.' },
      ctaSub: 'En 20 minutos oirás:',
      ctaBullets: {
        growth: ['Qué mira Google en empresas de tu sector, y qué ven diferente Instagram y TikTok','Qué esperan las plataformas de ti como emprendedor para mostrarte más','Por qué algunos competidores tienen más alcance con menos contenido'],
        rebuild: ['Qué ven Google y las redes en esta web y por qué te mantienen lejos','Qué hace falta para dar la vuelta a esas señales, en el orden que funciona','Cómo distinguir a quien realmente puede construirlo del que solo habla bonito'],
        fix: ['Cuál de estos puntos tiene más impacto en el ranking para tu sector','Qué plataformas rinden más en tu mercado (y cuáles cuestan tiempo)','Qué puedes hacer tú sin conocimientos técnicos, y qué es mejor delegar']
      },
      reassure: 'Sin argumentos de venta. Sin presión. Incluso si no acabamos trabajando juntos, te llevas consejos útiles.',
      or: 'O directamente por WhatsApp',
      footer: 'Harte Growth · hartegrowth.eu · Países Bajos y Costa Blanca',
      newLead: 'Nuevo lead',
      alainSubject: (n, comp, d, a) => `Nuevo lead: ${n}${comp ? ' (' + comp + ')' : ''} · ${d} · ${a}/100`,
      labels: { name:'Nombre', email:'Email', company:'Empresa', score:'Puntuación', time:'Hora', receivedByClient:'ABAJO: el email que recibió el cliente' }
    }
  };
  function domain(u){ try { return new URL(u).host.replace(/^www\./, ''); } catch (_) { return u || ''; } }
  const t = M[LANG];

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
  const dom = domain(url);
  const firstName = (name || '').split(' ')[0] || (LANG === 'es' ? 'hola' : LANG === 'en' ? 'there' : 'daar');

  // Dynamische verdict (komt van frontend, matched wat op de site staat)
  const verdictTitle = (verdict && verdict.head) || (t.hereReport(dom));
  const verdictBody = (verdict && verdict.body) || `Score ${avg}/100.`;
  const ctaMode = (verdict && verdict.ctaMode) || 'fix';
  const ctaLabel = (verdict && verdict.ctaLabel) || (LANG === 'es' ? 'Reservar llamada' : LANG === 'en' ? 'Book a call' : 'Plan mijn gesprek');

  // CTA-tekst boven de knoppen past bij de score, taal-specifiek
  const modeKey = (ctaMode === 'growth' || ctaMode === 'rebuild') ? ctaMode : 'fix';
  const rawHead = t.ctaHead[modeKey];
  // Vervang <em>...</em> door mail-safe italic-oranje
  const ctaHead = rawHead.replace(/<em>([^<]+)<\/em>/g, '<span style="font-family:\'Georgia\',serif;font-style:italic;color:#ff4d1a;font-weight:400;">$1</span>');
  const ctaSub = t.ctaSub;
  const ctaBullets = t.ctaBullets[modeKey];

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
    const badges = { nl:{ok:'ok', warn:'kan beter', bad:'fix nodig'}, en:{ok:'ok', warn:'could be better', bad:'needs fix'}, es:{ok:'ok', warn:'mejorable', bad:'a corregir'} }[LANG];
    if(f.cls === 'good') return badges.ok;
    if(f.cls === 'warn') return badges.warn;
    return badges.bad;
  };

  // Herbruikbare renderer voor 1 finding-blok
  const renderFinding = (f) => `
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
    </table>`;

  const sectionLabel = (txt) => `<div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8b95;letter-spacing:.08em;text-transform:uppercase;margin:22px 0 14px;padding-top:18px;border-top:1px dashed #25262e;">${escape(txt)}</div>`;

  // Lighthouse-findings + deep-SEO findings (exact zelfde layout als op de site)
  const hasLh = (findings && findings.length);
  const hasDeep = (deepFindings && deepFindings.length);
  const findingsHtml = (hasLh || hasDeep) ? `
    <div style="margin-top:8px;">
      ${hasLh ? `
        <div style="font-family:'JetBrains Mono',monospace;font-size:11px;color:#8a8b95;letter-spacing:.08em;text-transform:uppercase;margin-bottom:14px;">${escape(t.whatWeSaw)}</div>
        ${findings.slice(0, 8).map(renderFinding).join('')}
      ` : ''}
      ${hasDeep ? `
        ${sectionLabel(deepSectionLabel || (LANG==='en'?'Deeper SEO check (live parse of your HTML)':LANG==='es'?'Análisis SEO profundo (parseo en vivo de tu HTML)':'Diepere SEO-check (live-parse van je HTML)'))}
        ${deepFindings.slice(0, 12).map(renderFinding).join('')}
      ` : ''}
    </div>
  ` : '';

  const clientHtml = `<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f5f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f7;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#0a0a0c;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:36px 36px 24px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth · ${LANG === 'es' ? 'Escaneo' : LANG === 'en' ? 'Growth scan' : 'Groeiscan'}</div>
          <h1 style="color:#fff;font-size:26px;line-height:1.2;margin:10px 0 6px;font-weight:800;letter-spacing:-.03em;">${escape(t.hi(firstName))}<br>${escape(t.hereReport(''))} <span style="font-family:'Georgia',serif;font-style:italic;color:#ff4d1a;font-weight:400;">${escape(dom)}</span></h1>
          <p style="color:#8a8b95;font-size:14.5px;line-height:1.6;margin:0;">${escape(t.intro)}</p>
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
            <div style="font-family:'Georgia',serif;font-size:12px;color:#ff4d1a;letter-spacing:.1em;text-transform:uppercase;margin-bottom:10px;">${escape(t.nextStep)}</div>
            <h3 style="color:#fff;font-size:22px;line-height:1.25;letter-spacing:-.02em;margin:0 0 10px;font-weight:800;">${ctaHead}</h3>
            <p style="color:#c4c6cf;font-size:15px;line-height:1.55;margin:0 0 8px;">${escape(ctaSub)}</p>
            <ul style="color:#a5a7b0;font-size:14px;line-height:1.65;margin:0 0 22px;padding-left:20px;">
              ${ctaBullets.map(b => `<li>${escape(b)}</li>`).join('')}
            </ul>
            <p style="color:#8a8b95;font-size:13px;line-height:1.55;margin:0 0 20px;font-style:italic;">${escape(t.reassure)}</p>
            <a href="https://hartegrowth.eu/${LANG === 'nl' ? '' : LANG + '/'}landing.html#book" style="display:inline-block;background:#ff4d1a;color:#fff;text-decoration:none;padding:15px 28px;border-radius:9px;font-weight:700;font-size:15px;letter-spacing:-.01em;margin-right:6px;margin-bottom:8px;">${escape(ctaLabel)} →</a>
            <a href="https://wa.me/31634455762?text=${encodeURIComponent((LANG === 'es' ? 'Hola Harte Growth, acabo de hacer el escaneo para ' : LANG === 'en' ? 'Hi Harte Growth, I just did the scan for ' : 'Hoi Harte Growth, ik heb net de scan gedaan voor ') + dom)}" style="display:inline-block;background:transparent;color:#8a8b95;text-decoration:none;padding:15px 22px;border-radius:9px;border:1px solid #25262e;font-weight:500;font-size:14px;">${escape(t.or)}</a>
          </div>
        </td></tr>

        <tr><td style="padding:16px 36px;background:#0f1015;border-top:1px solid #25262e;color:#565968;font-size:12px;font-family:'SF Mono',Consolas,monospace;">
          ${escape(t.footer)}
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const clientText = `${t.hi(firstName)}

${t.hereReport(dom)}.

${t.intro}

Scores:
${scores.map(s => `- ${s.label}: ${s.score === null ? 'n/a' : Math.round(s.score*100) + '/100'}`).join('\n')}

Overall: ${avg}/100

${verdictTitle}
${verdictBody}

${(findings && findings.length) ? t.whatWeSaw + ':\n' + findings.slice(0,8).map(f => `- ${f.label}: ${f.value || ''}`).join('\n') + '\n' : ''}
${(deepFindings && deepFindings.length) ? (deepSectionLabel || 'Deeper SEO check') + ':\n' + deepFindings.slice(0,12).map(f => `- ${f.label}: ${f.value || ''}`).join('\n') + '\n' : ''}
${ctaSub}
${ctaBullets.map(b => '- ' + b).join('\n')}

${t.reassure}

${ctaLabel}: https://hartegrowth.eu/${LANG === 'nl' ? '' : LANG + '/'}landing.html#book
${t.or}: https://wa.me/31634455762

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
        subject: t.subjectClient,
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
          <div style="font-family:'Georgia',serif;font-size:12px;color:#ff4d1a;letter-spacing:.08em;text-transform:uppercase;">${escape(t.newLead)}</div>
        </td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;width:110px;">${escape(t.labels.name)}</td><td style="padding:6px 0;font-weight:600;">${escape(name)}</td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;">${escape(t.labels.email)}</td><td style="padding:6px 0;"><a href="mailto:${escape(email)}" style="color:#ff4d1a;text-decoration:none;">${escape(email)}</a></td></tr>
        ${company ? `<tr><td style="padding:6px 0;color:#8a8b95;">${escape(t.labels.company)}</td><td style="padding:6px 0;">${escape(company)}</td></tr>` : ''}
        <tr><td style="padding:6px 0;color:#8a8b95;">${escape(t.labels.score)}</td><td style="padding:6px 0;font-weight:700;color:${avg >= 65 ? '#4ade80' : avg >= 40 ? '#ffbd2e' : '#ff5c56'};">${avg}/100</td></tr>
        <tr><td style="padding:6px 0;color:#8a8b95;">${escape(t.labels.time)}</td><td style="padding:6px 0;font-size:13px;color:#8a8b95;">${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}</td></tr>
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
        subject: t.alainSubject(name, company, dom, avg),
        html: alainHtml,
        text: `${t.newLead}
${t.labels.name}: ${name}
${t.labels.email}: ${email}
${company ? t.labels.company + ': ' + company + '\n' : ''}${t.labels.score}: ${avg}/100
Domain: ${dom}
${t.labels.time}: ${new Date().toLocaleString('nl-NL', { timeZone: 'Europe/Amsterdam' })}

--- ${t.labels.receivedByClient} ---

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
