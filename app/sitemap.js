import { SITE_URL } from '@/lib/config';
import { ROUTES, url, eventKey } from '@/lib/i18n';
import { db } from '@/lib/supabase';

export const revalidate = 3600;

export default async function sitemap() {
  const s = db();
  const [books, events, news] = await Promise.all([
    s.from('books').select('slug,updated_at').eq('published', true),
    s.from('events').select('slug,category,updated_at').eq('published', true),
    s.from('news').select('slug,updated_at').eq('published', true),
  ]);
  const out = [];
  const add = (key, slug, lastModified) => {
    const languages = { pl: SITE_URL + url(key, 'pl', slug), fr: SITE_URL + url(key, 'fr', slug) };
    for (const l of ['pl', 'fr']) out.push({ url: languages[l], lastModified: lastModified || undefined, alternates: { languages } });
  };
  Object.keys(ROUTES).forEach((k) => add(k));
  (books.data || []).forEach((r) => add('books', r.slug, r.updated_at));
  (events.data || []).forEach((r) => add(eventKey(r.category), r.slug, r.updated_at));
  (news.data || []).forEach((r) => add('news', r.slug, r.updated_at));
  return out;
}
