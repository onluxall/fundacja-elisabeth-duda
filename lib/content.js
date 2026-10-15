import { cache } from 'react';
import { db } from './supabase';

const q = async (p) => { const { data, error } = await p; if (error) throw new Error(error.message); return data; };

export const getSettings = cache(async () => {
  const rows = await q(db().from('settings').select('key,value'));
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
});
export const getPage = cache(async (key) =>
  (await q(db().from('pages').select('*').eq('key', key).maybeSingle())) ?? { key, title_pl: '', title_fr: '', body_pl: '', body_fr: '', image: '' });

export const getBooks = cache(async () => q(db().from('books').select('*').eq('published', true).order('featured', { ascending: false }).order('sort').order('id', { ascending: false })));
export const getBook = cache(async (slug) => q(db().from('books').select('*').eq('slug', slug).eq('published', true).maybeSingle()));
export const getBookQrs = cache(async (bookId) => q(db().from('qr').select('code,title_pl,title_fr,sort,id').eq('book_id', bookId).eq('published', true).order('sort').order('id')));
export const getQrBookIds = cache(async () => new Set((await q(db().from('qr').select('book_id').eq('published', true))).map((r) => r.book_id)));

export const getEvents = cache(async (cat = null) => {
  let p = db().from('events').select('*').eq('published', true).order('starts_at', { ascending: true, nullsFirst: true });
  if (cat) p = p.eq('category', cat);
  return q(p);
});
export const getEvent = cache(async (slug) => q(db().from('events').select('*').eq('slug', slug).eq('published', true).maybeSingle()));

export const getPartners = cache(async () => q(db().from('partners').select('*').eq('published', true).order('sort').order('name')));
export const getNews = cache(async (limit = 200) => q(db().from('news').select('*').eq('published', true).order('date', { ascending: false }).order('id', { ascending: false }).limit(limit)));
export const getNewsItem = cache(async (slug) => q(db().from('news').select('*').eq('slug', slug).eq('published', true).maybeSingle()));

export const getQr = async (code) => q(db().from('qr').select('*').eq('code', code).eq('published', true).maybeSingle());

/** Today in Warsaw as YYYY-MM-DD (event dates are stored as Warsaw wall-clock time). */
export function todayWarsaw(offsetDays = 0) {
  const d = new Date(Date.now() + offsetDays * 864e5);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Warsaw', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}
export function splitEvents(list) {
  const cut = todayWarsaw(-1);
  const up = list.filter((e) => !e.starts_at || e.starts_at.slice(0, 10) >= cut);
  const past = list.filter((e) => e.starts_at && e.starts_at.slice(0, 10) < cut).reverse();
  return { up, past };
}
