import { cache } from 'react';
import { ROUTES, url, tFor, eventKey } from './i18n';
import { tr, excerpt, mediaUrl } from './format';
import { SITE_URL } from './config';
import * as C from './content';

/**
 * Resolve a URL path to a page: { key, slug, data, meta } or { redirect } or null (404).
 * Used by both generateMetadata and the page so the lookup runs once per request.
 */
export const resolve = cache(async (lang, segsIn) => {
  const segs = (segsIn || []).map((s) => decodeURIComponent(s));
  if (segs.length > 2) return null;
  const [first = '', slug = null] = segs;
  const t = tFor(lang);
  const s = await C.getSettings();

  let key = Object.keys(ROUTES).find((k) => ROUTES[k][lang] === first);
  if (!key) {
    const other = Object.keys(ROUTES).find((k) => first && Object.values(ROUTES[k]).includes(first));
    return other ? { redirect: url(other, lang, slug) } : null;
  }
  const alt = { pl: url(key, 'pl', slug), fr: url(key, 'fr', slug) };
  const base = { key, slug, alt, title: t(key), desc: s[`seo_desc_${lang}`], nav: key };

  if (key === 'home') {
    if (slug) return null;
    return { ...base, title: null, nav: 'home' };
  }
  if (['about', 'support', 'contact'].includes(key)) {
    if (slug) return null;
    const p = await C.getPage(key);
    return { ...base, data: p, title: tr(p, 'title', lang) || t(key), desc: excerpt(tr(p, 'body', lang), 160) || base.desc };
  }
  if (key === 'books') {
    if (!slug) return { ...base, nav: 'events' };
    const b = await C.getBook(slug);
    if (!b) return null;
    return { ...base, nav: 'events', data: b, title: tr(b, 'title', lang) + (b.author ? ` — ${b.author}` : ''), desc: excerpt(tr(b, 'body', lang), 160), image: b.cover ? mediaUrl(b.cover) : null };
  }
  if (['events', 'shows', 'meetings'].includes(key)) {
    if (!slug) return { ...base, nav: 'events' };
    const ev = await C.getEvent(slug);
    if (!ev) return null;
    const right = eventKey(ev.category);
    if (right !== key) return { redirect: url(right, lang, slug) };
    return { ...base, nav: 'events', data: ev, title: tr(ev, 'title', lang), desc: excerpt(tr(ev, 'body', lang), 160), image: ev.image ? mediaUrl(ev.image) : null };
  }
  if (key === 'partners') return slug ? null : { ...base, nav: 'events' };
  if (key === 'news') {
    if (!slug) return base;
    const n = await C.getNewsItem(slug);
    if (!n) return null;
    return { ...base, data: n, title: tr(n, 'title', lang), desc: excerpt(tr(n, 'body', lang), 160), image: n.image ? mediaUrl(n.image) : null };
  }
  return null;
});

/** Next.js Metadata object for a resolved page. */
export async function metaFor(lang, r) {
  const s = await C.getSettings();
  const t = tFor(lang);
  if (!r || r.redirect) return { title: t('not_found'), robots: { index: false } };
  const full = r.title ? `${r.title} | ${s.site_name}` : `${s.site_name} — ${s.tagline}`;
  const canonical = SITE_URL + r.alt[lang];
  return {
    metadataBase: new URL(SITE_URL),
    title: full,
    description: r.desc || s[`seo_desc_${lang}`],
    alternates: { canonical, languages: { pl: SITE_URL + r.alt.pl, fr: SITE_URL + r.alt.fr, 'x-default': SITE_URL + r.alt.pl } },
    openGraph: {
      type: 'website', siteName: s.site_name, title: r.title || s.site_name, description: r.desc || s[`seo_desc_${lang}`],
      url: canonical, locale: lang === 'fr' ? 'fr_FR' : 'pl_PL', images: [r.image || '/assets/img/og.jpg'],
    },
    icons: { icon: '/assets/img/pen.svg', apple: '/assets/img/apple-touch-icon.png' },
  };
}
