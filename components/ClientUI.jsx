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
    // „Nasi Partnerzy”: filter logos by project (?projekt=slug keeps the choice in the address).
    const pbtns = [...document.querySelectorAll('.pf-btn')];
    if (pbtns.length) {
      const show = (slug, push) => {
        pbtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.proj === slug)));
        let shown = 0;
        document.querySelectorAll('.pcat').forEach((sec) => {
          let n = 0;
          sec.querySelectorAll('li[data-projects]').forEach((li) => {
            const on = !slug || li.dataset.projects.split(' ').includes(slug);
            li.hidden = !on; if (on) n++;
          });
          sec.hidden = !n; shown += n;
        });
        const empty = document.querySelector('.pf-empty'); if (empty) empty.hidden = shown > 0;
        if (push) { const u = new URL(location.href); if (slug) u.searchParams.set('projekt', slug); else u.searchParams.delete('projekt'); history.replaceState(null, '', u); }
      };
      pbtns.forEach((b) => b.addEventListener('click', () => show(b.dataset.proj, true), o));
      const initial = new URLSearchParams(location.search).get('projekt') || '';
      if (pbtns.some((b) => b.dataset.proj === initial)) show(initial, false);
    }
    return () => { ac.abort(); document.body.style.overflow = ''; };
  }, []);
  return null;
}
