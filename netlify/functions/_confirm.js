// Bevestigingsmail voor de klant na het invullen van een formulier.
// Wordt gebruikt door send-contact, send-lead, send-video-lead en send-booking.
// Een mislukte bevestiging laat het formulier NIET mislukken: de aanvraag is dan al bij Harte Growth binnen.

const WA = 'https://wa.me/34603103974';
const PHONE = '+34 603 103 974';
const MAIL = 'info@hartegrowth.eu';

const T = {
  nl: {
    labels: { name: 'Naam', company: 'Bedrijf', website: 'Website', message: 'Bericht', wants: 'Je zoekt', branche: 'Branche', languages: 'Talen', contact: 'Contact', when: 'Wanneer', material: 'Materiaal', amount: 'Hoeveel', note: 'Opmerking' },
    hi: (n) => `Hoi ${n},`,
    sign: 'Groet,<br>Alain<br>Harte Growth',
    signText: 'Groet,\nAlain\nHarte Growth',
    sumTitle: 'Je gegevens',
    faster: 'Haast? App ons gerust.',
    waBtn: 'WhatsApp',
    foot: 'Je krijgt deze mail omdat je een formulier invulde op hartegrowth.eu.',
    kinds: {
      contact: { subject: 'Bericht ontvangen', body: 'Bedankt voor je bericht. We hebben het ontvangen en reageren meestal binnen een werkdag.' },
      groeiscan: { subject: 'Groeiscan aangevraagd', body: 'Bedankt voor je aanvraag. We bekijken je website en sturen je binnen een werkdag een rapport met tips.' },
      website: { subject: 'Aanvraag ontvangen', body: 'Bedankt voor je aanvraag. We kijken naar je bedrijf en je site, en nemen binnen een werkdag contact met je op.' },
      video: { subject: 'Video-aanvraag ontvangen', body: 'Bedankt voor je aanvraag. We nemen binnen een werkdag contact met je op over je foto\'s of filmpjes.' },
      booking: { subject: (w) => `Gesprek genoteerd: ${w}`, body: (w) => `Bedankt. We hebben je gesprek genoteerd voor <strong>${w}</strong>. We laten je nog weten of dat tijdstip lukt.`, bodyText: (w) => `Bedankt. We hebben je gesprek genoteerd voor ${w}. We laten je nog weten of dat tijdstip lukt.` }
    }
  },
  en: {
    labels: { name: 'Name', company: 'Company', website: 'Website', message: 'Message', wants: 'Looking for', branche: 'Industry', languages: 'Languages', contact: 'Contact', when: 'When', material: 'Material', amount: 'How many', note: 'Note' },
    hi: (n) => `Hi ${n},`,
    sign: 'Best,<br>Alain<br>Harte Growth',
    signText: 'Best,\nAlain\nHarte Growth',
    sumTitle: 'Your details',
    faster: 'In a hurry? Just send us a WhatsApp.',
    waBtn: 'WhatsApp',
    foot: 'You got this email because you filled in a form on hartegrowth.eu.',
    kinds: {
      contact: { subject: 'Message received', body: 'Thanks for your message. We got it and usually reply within one working day.' },
      groeiscan: { subject: 'Growth scan requested', body: 'Thanks for your request. We\'ll look at your website and send you a report with tips within one working day.' },
      website: { subject: 'Request received', body: 'Thanks for your request. We\'ll look at your business and your site, and get back to you within one working day.' },
      video: { subject: 'Video request received', body: 'Thanks for your request. We\'ll get back to you within one working day about your photos or clips.' },
      booking: { subject: (w) => `Call noted: ${w}`, body: (w) => `Thanks. We've noted your call for <strong>${w}</strong>. We'll let you know if that time works.`, bodyText: (w) => `Thanks. We've noted your call for ${w}. We'll let you know if that time works.` }
    }
  },
  es: {
    labels: { name: 'Nombre', company: 'Empresa', website: 'Web', message: 'Mensaje', wants: 'Buscas', branche: 'Sector', languages: 'Idiomas', contact: 'Contacto', when: 'Cuándo', material: 'Material', amount: 'Cuántas', note: 'Comentario' },
    hi: (n) => `Hola ${n}:`,
    sign: 'Un saludo,<br>Alain<br>Harte Growth',
    signText: 'Un saludo,\nAlain\nHarte Growth',
    sumTitle: 'Tus datos',
    faster: '¿Tienes prisa? Escríbenos por WhatsApp.',
    waBtn: 'WhatsApp',
    foot: 'Recibes este correo porque rellenaste un formulario en hartegrowth.eu.',
    kinds: {
      contact: { subject: 'Mensaje recibido', body: 'Gracias por tu mensaje. Lo hemos recibido y solemos responder en un día laborable.' },
      groeiscan: { subject: 'Escaneo solicitado', body: 'Gracias por tu solicitud. Revisamos tu web y te enviamos un informe con consejos en un día laborable.' },
      website: { subject: 'Solicitud recibida', body: 'Gracias por tu solicitud. Miramos tu negocio y tu web, y te contactamos en un día laborable.' },
      video: { subject: 'Solicitud de vídeo recibida', body: 'Gracias por tu solicitud. Te contactamos en un día laborable sobre tus fotos o clips.' },
      booking: { subject: (w) => `Llamada anotada: ${w}`, body: (w) => `Gracias. Hemos anotado tu llamada para el <strong>${w}</strong>. Te confirmamos si esa hora nos va bien.`, bodyText: (w) => `Gracias. Hemos anotado tu llamada para el ${w}. Te confirmamos si esa hora nos va bien.` }
    }
  }
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function extractEmail(s) {
  const m = /[^\s@<>"']+@[^\s@<>"']+\.[^\s@<>"']+/.exec(String(s || ''));
  return m ? m[0] : null;
}

// rows: [[sleutel, waarde], ...] met sleutels uit labels; lege waarden worden overgeslagen
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
          <a href="${WA}" style="display:inline-block;background:#ff4d1a;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:600;font-size:15px;">${esc(L.waBtn)} ${PHONE}</a>
          <p style="color:#17140f;font-size:15px;line-height:1.6;margin:26px 0 0;">${L.sign}</p>
        </td></tr>
        <tr><td style="padding:22px 32px 28px;">
          <p style="color:#6b6a63;font-size:12px;line-height:1.5;margin:0;border-top:1px solid #e9e1d1;padding-top:16px;">${esc(L.foot)}<br><a href="https://hartegrowth.eu" style="color:#6b6a63;">hartegrowth.eu</a><br><a href="mailto:${MAIL}" style="color:#6b6a63;">${MAIL}</a><br>${PHONE}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const text = `${L.hi(first)}

${bodyText}
${list.length ? '\n' + L.sumTitle + ':\n' + list.map(([k, v]) => `${k}: ${v}`).join('\n') + '\n' : ''}
${L.faster} ${WA}

${L.signText}

--
${L.foot}
hartegrowth.eu
${MAIL}
${PHONE}`;

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
