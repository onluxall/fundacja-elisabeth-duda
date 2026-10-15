import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/lib/supabase';
import { getQr } from '@/lib/content';
import { tr } from '@/lib/format';
import { url } from '@/lib/i18n';
import SiteShell from '@/components/SiteShell';
import { QrBody } from '@/components/pages';

// The address printed in the books: /qr/{code}. Never cached — every scan is counted.
export const dynamic = 'force-dynamic';

async function langOf(sp) {
  if (sp.lang === 'fr' || sp.lang === 'pl') return sp.lang;
  const al = (await headers()).get('accept-language') || '';
  return al.toLowerCase().startsWith('fr') ? 'fr' : 'pl';
}

export async function generateMetadata({ params, searchParams }) {
  const { code } = await params;
  const lang = await langOf(await searchParams);
  const q = await getQr(code);
  return { title: q ? `${tr(q, 'title', lang)} | Fundacja Elisabeth Duda` : 'QR', robots: { index: false }, icons: { icon: '/assets/img/pen.svg' } };
}

export default async function QrPage({ params, searchParams }) {
  const { code } = await params;
  const sp = await searchParams;
  const lang = await langOf(sp);
  const q = await getQr(decodeURIComponent(code));
  if (!q) notFound();

  const ua = (await headers()).get('user-agent') || '';
  if (!sp.nocount && !/bot|crawl|spider|preview|facebookexternalhit|slurp/i.test(ua)) {
    await db().rpc('qr_hit', { p_code: q.code });
  }
  if (q.target_url) redirect(q.target_url);

  let book = null, siblings = [];
  if (q.book_id) {
    const s = db();
    const [{ data: b }, { data: sib }] = await Promise.all([
      s.from('books').select('id,slug,title_pl,title_fr').eq('id', q.book_id).maybeSingle(),
      s.from('qr').select('code,title_pl,title_fr').eq('book_id', q.book_id).eq('published', true).order('sort').order('id'),
    ]);
    book = b; siblings = sib || [];
  }
  const self = `/qr/${encodeURIComponent(q.code)}`;
  return (
    <SiteShell lang={lang} nav="events" alt={{ pl: `${self}?lang=pl&nocount=1`, fr: `${self}?lang=fr&nocount=1` }}>
      <QrBody lang={lang} q={q} book={book} siblings={siblings} />
    </SiteShell>
  );
}
