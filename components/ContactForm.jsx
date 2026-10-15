'use client';
import { useActionState, useState, useEffect } from 'react';
import { sendMessage } from '@/app/actions';
import { tFor } from '@/lib/i18n';

export default function ContactForm({ lang }) {
  const t = tFor(lang);
  const [state, action, pending] = useActionState(sendMessage, null);
  const [ts, setTs] = useState(0);
  useEffect(() => setTs(Date.now()), []);
  const sent = state?.ok;
  return (
    <form className="form pasteup" action={action} id="form">
      <span className="tape tape-a"></span>
      {sent && <p className="notice notice-ok" role="status">{t('sent')}</p>}
      {state && !state.ok && <p className="notice notice-err" role="alert">{t(state.err)}</p>}
      {!sent && <>
        <input type="hidden" name="lang" value={lang} />
        <input type="hidden" name="t" value={ts} />
        <div className="hp" aria-hidden="true"><label>Website <input type="text" name="website" tabIndex={-1} autoComplete="off" /></label></div>
        <label>{t('name')}<input name="name" required maxLength={200} autoComplete="name" /></label>
        <label>{t('email')}<input name="email" type="email" required maxLength={200} autoComplete="email" /></label>
        <label>{t('message')}<textarea name="body" rows={6} required minLength={5} maxLength={8000}></textarea></label>
        <p className="muted small">{t('privacy')}</p>
        <button className="btn btn-red" type="submit" disabled={pending}>{pending ? t('sending') : t('send')} →</button>
      </>}
    </form>
  );
}
