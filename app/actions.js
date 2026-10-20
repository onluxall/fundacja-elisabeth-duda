'use server';
import { db } from '@/lib/supabase';

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

/** Forward a saved message to kontakt@ through the Spacemail mailbox (SMTP). Never blocks the form. */
async function notify({ name, email, body, lang }) {
  const pass = process.env.SMTP_PASS;
  if (!pass) return;
  const user = process.env.SMTP_USER || 'kontakt@fundacja-ed.com';
  const to = process.env.CONTACT_TO || user;
  try {
    const { createTransport } = await import('nodemailer');
    const mail = createTransport({
      host: process.env.SMTP_HOST || 'mail.spacemail.com', port: Number(process.env.SMTP_PORT || 465), secure: true,
      auth: { user, pass }, connectionTimeout: 8000, greetingTimeout: 8000, socketTimeout: 8000,
    });
    await mail.sendMail({
      from: { name: 'Formularz – Fundacja Elisabeth Duda', address: user }, to, replyTo: { name, address: email },
      subject: `Wiadomość ze strony: ${name}`,
      text: `${body}\n\n—\n${name} <${email}> · ${lang.toUpperCase()}\nOdpowiedz na tę wiadomość, aby napisać do nadawcy.`,
      html: `<p style="white-space:pre-wrap">${esc(body)}</p><hr><p>${esc(name)} &lt;${esc(email)}&gt; · ${lang.toUpperCase()}<br><small>Odpowiedz na tę wiadomość, aby napisać do nadawcy.</small></p>`,
    });
  } catch (e) { console.error('contact mail failed', e?.message); /* message is already in the panel */ }
}

/** Contact form → messages table (RLS allows anonymous insert only) + e-mail to kontakt@. */
export async function sendMessage(prev, form) {
  const lang = form.get('lang') === 'fr' ? 'fr' : 'pl';
  const name = String(form.get('name') ?? '').trim().slice(0, 200);
  const email = String(form.get('email') ?? '').trim().slice(0, 200);
  const body = String(form.get('body') ?? '').trim();
  // honeypot + too-fast submit = bot: pretend success
  if (form.get('website') || Date.now() - Number(form.get('t') || 0) < 3000) return { ok: true };
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || body.length < 5 || body.length > 8000) return { ok: false, err: 'form_error' };
  const { error } = await db().from('messages').insert({ name, email, body, lang });
  if (error) return { ok: false, err: 'send_error' };
  await notify({ name, email, body, lang });
  return { ok: true };
}
