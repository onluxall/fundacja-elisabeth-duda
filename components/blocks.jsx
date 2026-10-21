import { url, tFor, eventKey } from '@/lib/i18n';
import { tr, md, mediaUrl, excerpt, fmtDate, parts } from '@/lib/format';

export const Html = ({ html, className }) => <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
export const Prose = ({ src }) => <Html className="prose" html={md(src)} />;

export function BookCover({ b, lang, cls = '', siteName = '' }) {
  const cover = (lang === 'fr' && b.cover_fr) || b.cover || b.cover_fr;
  if (cover) return <img className={`cover ${cls}`} src={mediaUrl(cover)} alt={tr(b, 'title', lang)} loading="lazy" />;
  return (
    <div className={`cover cover-poster ${cls}`} role="img" aria-label={tr(b, 'title', lang)}>
      <img className="cover-pen" src="/assets/img/pen-white.svg" alt="" />
      <span className="cover-author">{b.author || siteName}</span>
      <span className="cover-title">{tr(b, 'title', lang)}</span>
    </div>
  );
}

const tilt = (i) => `tilt-${i % 3}`;

export function BookCard({ b, i = 0, lang, hasQr, siteName }) {
  const t = tFor(lang);
  const badge = tr(b, 'badge', lang);
  return (
    <article className={`poster poster-book ${tilt(i)}`}>
      <a className="poster-link" href={url('books', lang, b.slug)}>
        <BookCover b={b} lang={lang} siteName={siteName} />
        {badge && <span className="sticker">{badge}</span>}
        <div className="poster-body">
          {b.author && <p className="kicker">{b.author}</p>}
          <h3>{tr(b, 'title', lang)}</h3>
          {tr(b, 'subtitle', lang) && <p className="muted">{tr(b, 'subtitle', lang)}</p>}
          {hasQr && <p className="qr-flag"><span aria-hidden="true">▣</span> {t('qr_badge')}</p>}
        </div>
      </a>
      {b.buy_url && <p className="poster-buy"><a className="btn btn-red" href={b.buy_url} target="_blank" rel="noopener">{t('buy')} ↗</a></p>}
    </article>
  );
}

export function EventCard({ ev, i = 0, lang }) {
  const t = tFor(lang);
  const p = parts(ev.starts_at);
  const label = ev.category === 'show' ? t('shows') : ev.category === 'meeting' ? t('meetings') : t('events');
  return (
    <article className={`poster poster-event ${tilt(i)}`}>
      <a className="poster-link" href={url(eventKey(ev.category), lang, ev.slug)}>
        {ev.image ? <img className="poster-img" src={mediaUrl(ev.image)} alt="" loading="lazy" />
          : <div className="poster-img poster-img-empty"><img src="/assets/img/pen.svg" alt="" /></div>}
        {p && <div className="datestamp"><b>{String(p.d).padStart(2, '0')}</b><span>{String(p.mo).padStart(2, '0')}.{p.y}</span></div>}
        <div className="poster-body">
          <p className={`label label-${ev.category}`}>{label}</p>
          <h3>{tr(ev, 'title', lang)}</h3>
          {ev.place && <p className="muted">📍 {ev.place}</p>}
        </div>
      </a>
    </article>
  );
}

export function NewsCard({ n, i = 0, lang }) {
  const t = tFor(lang);
  return (
    <article className={`poster poster-news ${tilt(i)}`}>
      <a className="poster-link" href={url('news', lang, n.slug)}>
        {n.image && <img className="poster-img" src={mediaUrl(n.image)} alt="" loading="lazy" />}
        <div className="poster-body">
          <p className="kicker">{fmtDate(n.date, lang)}</p>
          <h3>{tr(n, 'title', lang)}</h3>
          <p>{excerpt(tr(n, 'body', lang), 150)}</p>
          <span className="more">{t('read_more')} →</span>
        </div>
      </a>
    </article>
  );
}

export function Empty({ lang }) {
  return <div className="empty"><img src="/assets/img/pen.svg" alt="" /><p>{tFor(lang)('nothing_yet')}</p></div>;
}

export function SectionHead({ title, tag, more, moreLabel }) {
  return (
    <header className="sec-head">
      <h2 className="h-lg">{tag && <span className="tag">{tag}</span>}{title}</h2>
      {more && <a className="link-arrow" href={more}>{moreLabel} →</a>}
    </header>
  );
}

export function EventsTabs({ active, lang }) {
  const t = tFor(lang);
  const tabs = [['events', t('all_events')], ['shows', t('shows')], ['meetings', t('meetings')]];
  return (
    <nav className="tabs" aria-label={t('events')}>
      {tabs.map(([k, label]) => <a key={k} href={url(k, lang)} aria-current={k === active ? 'page' : undefined}>{label}</a>)}
    </nav>
  );
}

export function Pasteup({ src, cls = 'pasteup-wide' }) {
  return <figure className={`pasteup ${cls}`}><span className="tape tape-a"></span><img src={src} alt="" /></figure>;
}

export function JsonLd({ graph }) {
  if (!graph?.length) return null;
  const json = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}
