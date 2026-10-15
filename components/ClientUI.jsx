'use client';
import { useEffect } from 'react';

/** Mobile menu, sub-menu toggles and "copy" buttons. Progressive enhancement over server-rendered HTML. */
export default function ClientUI() {
  useEffect(() => {
    const ac = new AbortController();
    const o = { signal: ac.signal };
    const btn = document.querySelector('.menu-btn');
    const menu = document.getElementById('menu');
    if (btn && menu) {
      btn.addEventListener('click', () => {
        const open = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', String(open));
        menu.classList.toggle('is-open', open);
        document.body.style.overflow = open ? 'hidden' : '';
      }, o);
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) btn.click(); }, o);
    }
    document.querySelectorAll('.sub-toggle').forEach((tg) => tg.addEventListener('click', () => {
      const li = tg.closest('.has-sub');
      const open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      tg.setAttribute('aria-expanded', String(open));
    }, o));
    document.querySelectorAll('.copy').forEach((b) => b.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); } catch { /* clipboard blocked — label still confirms */ }
      const old = b.textContent; b.textContent = b.dataset.done; b.classList.add('is-done');
      setTimeout(() => { b.textContent = old; b.classList.remove('is-done'); }, 1600);
    }, o));
    return () => { ac.abort(); document.body.style.overflow = ''; };
  }, []);
  return null;
}
