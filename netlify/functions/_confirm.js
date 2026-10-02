// Bevestigingsmail voor de klant na het invullen van een formulier.
// Wordt gebruikt door send-contact, send-lead, send-video-lead en send-booking.
// Een mislukte bevestiging laat het formulier NIET mislukken: de aanvraag is dan al bij Harte Growth binnen.

const WA = 'https://wa.me/34603103974';
const PHONE = '+34 603 103 974';
const MAIL = 'info@hartegrowth.eu';

const T = {
  nl: {
    labels: { name: 'Naam', company: 'Bedrijf', website: 'Website', message: 'Bericht', wants: 'Je zoekt', branche: 'Branche', languages: 'Talen', contact: 'Contact', when: 'Moment', material: 'Materiaal', amount: 'Hoeveelheid', note: 'Opmerking' },
    hi: (n) => `Hoi ${n},`,
    sign: 'Groet,<br>Alain — Harte Growth',
    signText: 'Groet,\nAlain — Harte Growth',
    sumTitle: 'Wat je ons stuurde',
    faster: 'Liever sneller? Stuur ons een WhatsApp:',
    waBtn: 'WhatsApp ons',
    foot: 'Je krijgt deze mail omdat je een formulier invulde op hartegrowth.eu. Antwoorden op deze mail komt gewoon bij ons aan.',
    kinds: {
      contact: { subject: 'We hebben je bericht ontvangen', body: 'Bedankt voor je bericht. Het is goed bij ons aangekomen. We lezen het persoonlijk en reageren meestal binnen één werkdag.' },
      groeiscan: { subject: 'Je groeiscan is aangevraagd', body: 'Bedankt voor je aanvraag. We bekijken je website op vindbaarheid, snelheid, mobiel en techniek, en mailen je binnen één werkdag een rapport met concrete tips.' },
      website: { subject: 'We hebben je aanvraag ontvangen', body: 'Bedankt voor je aanvraag. We kijken naar je bedrijf en je huidige site, en nemen binnen één werkdag contact met je op om te bespreken wat bij je past.' },
      video: { subject: 'We hebben je video-aanvraag ontvangen', body: 'Bedankt voor je aanvraag. We nemen binnen één werkdag contact met je op. Dan hoor je hoe je je foto\'s of clips aanlevert en wanneer je video klaar is.' },
      booking: { subject: (w) => `Je gesprek staat genoteerd: ${w}`, body: (w) => `Bedankt. Je groeigesprek staat genoteerd voor <strong>${w}</strong>. We bevestigen het moment nog even, of stellen een ander tijdstip voor als het niet uitkomt.`, bodyText: (w) => `Bedankt. Je groeigesprek staat genoteerd voor ${w}. We bevestigen het moment nog even, of stellen een ander tijdstip voor als het niet uitkomt.` }
    }
  },
  en: {
    labels: { name: 'Name', company: 'Company', website: 'Website', message: 'Message', wants: 'Looking for', branche: 'Industry', languages: 'Languages', contact: 'Contact', when: 'Time', material: 'Material', amount: 'Amount', note: 'Note' },
    hi: (n) => `Hi ${n},`,
    sign: 'Best,<br>Alain — Harte Growth',
    signText: 'Best,\nAlain — Harte Growth',
    sumTitle: 'What you sent us',
    faster: 'Want it quicker? Send us a WhatsApp:',
    waBtn: 'WhatsApp us',
    foot: 'You received this email because you filled in a form on hartegrowth.eu. Replying to this email reaches us directly.',
    kinds: {
      contact: { subject: 'We received your message', body: 'Thanks for your message. It has reached us. We read every message personally and usually reply within one working day.' },
      groeiscan: { subject: 'Your growth scan has been requested', body: 'Thanks for your request. We\'ll check your website for findability, speed, mobile and technical issues, and email you a report with concrete tips within one working day.' },
      website: { subject: 'We received your request', body: 'Thanks for your request. We\'ll look at your business and your current site, and get in touch within one working day to discuss what fits you.' },
      video: { subject: 'We received your video request', body: 'Thanks for your request. We\'ll get in touch within one working day to explain how to send your photos or clips and when your video will be ready.' },
      booking: { subject: (w) => `Your call is noted: ${w}`, body: (w) => `Thanks. Your growth call is noted for <strong>${w}</strong>. We'll confirm the time, or suggest another one if it doesn't work for us.`, bodyText: (w) => `Thanks. Your growth call is noted for ${w}. We'll confirm the time, or suggest another one if it doesn't work for us.` }
    }
  },
  es: {
    labels: { name: 'Nombre', company: 'Empresa', website: 'Web', message: 'Mensaje', wants: 'Buscas', branche: 'Sector', languages: 'Idiomas', contact: 'Contacto', when: 'Momento', material: 'Material', amount: 'Cantidad', note: 'Comentario' },
    hi: (n) => `Hola ${n}:`,
    sign: 'Un saludo,<br>Alain — Harte Growth',
    signText: 'Un saludo,\nAlain — Harte Growth',
    sumTitle: 'Lo que nos enviaste',
    faster: '¿Lo quieres más rápido? Escríbenos por WhatsApp:',
    waBtn: 'Escríbenos por WhatsApp',
    foot: 'Recibes este correo porque rellenaste un formulario en hartegrowth.eu. Si respondes a este correo, nos llega directamente.',
    kinds: {
      contact: { subject: 'Hemos recibido tu mensaje', body: 'Gracias por tu mensaje. Nos ha llegado bien. Lo leemos personalmente y solemos responder en un día laborable.' },
      groeiscan: { subject: 'Has solicitado tu escaneo de crecimiento', body: 'Gracias por tu solicitud. Revisamos tu web en visibilidad, velocidad, móvil y aspectos técnicos, y te enviamos un informe con consejos concretos en un día laborable.' },
      website: { subject: 'Hemos recibido tu solicitud', body: 'Gracias por tu solicitud. Miramos tu negocio y tu web actual, y te contactamos en un día laborable para hablar de lo que mejor te encaja.' },
      video: { subject: 'Hemos recibido tu solicitud de vídeo', body: 'Gracias por tu solicitud. Te contactamos en un día laborable para explicarte cómo enviarnos tus fotos o clips y cuándo estará listo tu vídeo.' },
      booking: { subject: (w) => `Tu llamada está anotada: ${w}`, body: (w) => `Gracias. Tu llamada está anotada para el <strong>${w}</strong>. Te confirmamos la hora o te proponemos otra si no nos viene bien.`, bodyText: (w) => `Gracias. Tu llamada está anotada para el ${w}. Te confirmamos la hora o te proponemos otra si no nos viene bien.` }
    }
  }
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function extractEmail(s) {
  const m = /[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+/.exec(String(s || ''));
  return m ? m[0] : null;
}

// rows: [[sleutel, waarde], ...] met sleutels uit labels (name, company, ...) — lege waarden worden overgeslagen
async function sendConfirmation({ apiKey, from, to, lang, name, kind, when, rows }) {
  const email = extractEmail(to);
  if (!apiKey || !email) return { skipped: true };
  const L = T[lang] || T.nl;
  const K = L.kinds[kind] || L.kinds.contact;
  const first = String(name || '').trim().split(/\s+/)[0] || '';
  const subject = typeof K.subject === 'function' ? K.subject(when) : K.subject;
  const bodyHtml = typeof K.body === 'function' ? K.body(esc(when)) : esc(K.body);
  const bodyText = K.bodyText ? K.bodyText(when) : K.body;
  const list = (rows || []).filter((r) => r && r[1] != null && String(r[1]).trim() !== '').map(([k, v]) => [L.labels[k] || k, v]);

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<body style="margin:0;padding:0;background:#f6f1e7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;padding:40px 20px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e9e1d1;border-radius:14px;overflow:hidden;max-width:100%;">
        <tr><td style="padding:32px 32px 8px;">
          <div style="font-family:'Georgia',serif;font-size:14px;color:#ff4d1a;letter-spacing:.05em;text-transform:uppercase;">Harte Growth</div>
          <h1 style="color:#17140f;font-size:24px;line-height:1.25;margin:8px 0 18px;font-weight:800;letter-spacing:-.02em;">${esc(subject)}</h1>
          <p style="color:#17140f;font-size:16px;line-height:1.6;margin:0 0 12px;">${esc(L.hi(first))}</p>
          <p style="color:#17140f;font-size:16px;line-height:1.6;margin:0 0 22px;">${bodyHtml}</p>
          ${list.length ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f1e7;border:1px solid #e9e1d1;border-radius:10px;padding:16px 20px;color:#17140f;font-size:14px;line-height:1.55;">
            <tr><td colspan="2" style="padding:0 0 8px;font-family:'JetBrains Mono',monospace;font-size:11px;color:#6b6a63;letter-spacing:.08em;text-transform:uppercase;">${esc(L.sumTitle)}</td></tr>
            ${list.map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#6b6a63;width:120px;vertical-align:top;">${esc(k)}</td><td style="padding:4px 0;white-space:pre-wrap;">${esc(String(v).slice(0, 1500))}</td></tr>`).join('')}
          </table>` : ''}
          <p style="color:#17140f;font-size:15px;line-height:1.6;margin:22px 0 12px;">${esc(L.faster)}</p>
          <a href="${WA}" style="display:inline-block;background:#ff4d1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px;">${esc(L.waBtn)} · ${PHONE}</a>
          <p style="color:#17140f;font-size:15px;line-height:1.6;margin:26px 0 0;">${L.sign}</p>
        </td></tr>
        <tr><td style="padding:22px 32px 28px;">
          <p style="color:#6b6a63;font-size:12px;line-height:1.5;margin:0;border-top:1px solid #e9e1d1;padding-top:16px;">${esc(L.foot)}<br><a href="https://hartegrowth.eu" style="color:#6b6a63;">hartegrowth.eu</a> · <a href="mailto:${MAIL}" style="color:#6b6a63;">${MAIL}</a> · ${PHONE}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${L.hi(first)}

${bodyText}
${list.length ? '\n' + L.sumTitle + ':\n' + list.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n' : ''}
${L.faster} ${WA} (${PHONE})

${L.signText}

--
${L.foot}
hartegrowth.eu · ${MAIL} · ${PHONE}`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [email], reply_to: MAIL, subject, html, text })
    });
    if (!res.ok) {
      console.error('Resend confirmation error', res.status, await res.text());
      return { ok: false };
    }
    return { ok: true };
  } catch (err) {
    console.error('confirmation exception', err);
    return { ok: false };
  }
}

module.exports = { sendConfirmation, extractEmail };
