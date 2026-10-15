'use server';
import { db } from '@/lib/supabase';

/** Contact form → messages table (RLS allows anonymous insert only). */
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
  return { ok: true };
}
