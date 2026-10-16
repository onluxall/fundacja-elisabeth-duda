import { url, tFor } from '@/lib/i18n';
import { tr, md, mediaUrl, excerpt, fmtDate, mediaInfo } from '@/lib/format';
import { SITE_URL } from '@/lib/config';
import * as C from '@/lib/content';
import { Html, Prose, BookCover, BookCard, EventCard, NewsCard, Empty, SectionHead, EventsTabs, Pasteup, JsonLd } from './blocks';
import { Socials } from './SiteShell';
import ContactForm from './ContactForm';

export function orgSchema(s, lang) {
  const same = ['facebook', 'linkedin', 'youtube', 'instagram'].map((k) => s[k]).filter(Boolean);
  const o = { '@type': 'NGO', '@id': `${SITE_URL}/#org`, name: s.site_name, url: `${SITE_URL}/`, logo: `${SITE_URL}/assets/img/logo-color.svg`, slogan: s.tagline, description: s[`seo_desc_${lang}`] };
  if (same.length) o.sameAs = same;
  if (s.email) o.email = s.email;
  if (s.phone) o.telephone = s.phone;
  if (s.address) o.address = s.address;
  if (s.krs) o.identifier = { '@type': 'PropertyValue', propertyID: 'KRS', value: s.krs };
  return o;
}

export async function Home({ lang }) {
  const t = tFor(lang);
  const [s, home, books, allEvents, news, support, qrBooks] = await Promise.all([
    C.getSettings(), C.getPage('home'), C.getBooks(), C.getEvents(), C.getNews(3), C.getPage('support'), C.getQrBookIds()]);
  const featured = books[0];
  const { up, past } = C.splitEvents(allEvents);
  const events = (up.length ? up : past).slice(0, 3);
  const words = (tr(home, 'title', lang) || s.site_name).split(',').map((w) => w.trim()).filter(Boolean);
  return (
    <>
      <JsonLd graph={[orgSchema(s, lang), { '@type': 'WebSite', name: s.site_name, url: `${SITE_URL}/`, inLanguage: ['pl', 'fr'], publisher: { '@id': `${SITE_URL}/#org` } }]} />
      <section className="hero">
        <div className="hero-wall" aria-hidden="true"><span className="halftone"></span><span className="frames"></span></div>
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <p className="hero-kicker"><span className="tag tag-blue">PL ✕ FR</span> {s.tagline}</p>
            <h1 className="hero-title">
              {words.map((w, i) => <span key={i} className={`w${(i % 3) + 1}${i % 3 === 1 ? ' spray' : ''}`}>{w}</span>)}
            </h1>
            <svg className="squiggle" viewBox="0 0 300 30" aria-hidden="true"><path d="M5 18 C 40 2, 60 30, 95 14 S 150 4, 170 18 S 230 28, 255 12 S 285 10, 295 16" /></svg>
            <Html className="hero-text" html={md(tr(home, 'body', lang))} />
            <p className="hero-cta">
              <a className="btn btn-red" href={url('books', lang)}>{t('our_books')}</a>
              <a className="btn btn-ghost" href={url('about', lang)}>{t('about')}</a>
            </p>
          </div>
          {featured && (
            <div className="hero-poster">
              <a className="pasteup" href={url('books', lang, featured.slug)}>
                <span className="tape tape-a" aria-hidden="true"></span><span className="tape tape-b" aria-hidden="true"></span>
                <BookCover b={featured} lang={lang} cls="cover-hero" siteName={s.site_name} />
                <span className="pasteup-label">{tr(featured, 'badge', lang) || t('featured')}</span>
              </a>
              <p className="hero-poster-cap"><b>{tr(featured, 'title', lang)}</b><br />{tr(featured, 'subtitle', lang)}</p>
            </div>
          )}
        </div>
      </section>
      <div className="drips" aria-hidden="true"></div>

      <section className="wrap sec">
        <SectionHead title={t('our_books')} tag="01" more={url('books', lang)} moreLabel={t('books')} />
        <div className="grid grid-3">{books.map((b, i) => <BookCard key={b.id} b={b} i={i} lang={lang} hasQr={qrBooks.has(b.id)} siteName={s.site_name} />)}</div>
      </section>

      <section className="band band-dark">
        <div className="wrap sec">
          <SectionHead title={t('events')} tag="02" more={url('events', lang)} moreLabel={t('all_events')} />
          {events.length ? <div className="grid grid-3">{events.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} lang={lang} />)}</div> : (
            <div className="cats">{['shows', 'meetings'].map((k) => <a key={k} className="cat" href={url(k, lang)}><span>{t(k)}</span></a>)}</div>
          )}
        </div>
      </section>

      <section className="wrap sec">
        <SectionHead title={t('latest_news')} tag="03" more={url('news', lang)} moreLabel={t('all_news')} />
        {news.length ? <div className="grid grid-3">{news.map((n, i) => <NewsCard key={n.id} n={n} i={i} lang={lang} />)}</div> : <Empty lang={lang} />}
      </section>

      <section className="wrap sec">
        <div className="support-banner">
          <img className="support-pen" src="/assets/img/pen.svg" alt="" />
          <div><h2 className="h-lg">{t('support')}</h2><Html html={md(excerpt(tr(support, 'body', lang), 220))} /></div>
          <a className="btn btn-red" href={url('support', lang)}>{t('support')} →</a>
        </div>
      </section>
    </>
  );
}

export async function StaticPage({ lang, r }) {
  const s = await C.getSettings();
  const p = r.data;
  const graph = [orgSchema(s, lang)];
  if (r.key === 'about') graph.push({ '@type': 'AboutPage', name: tr(p, 'title', lang), about: { '@id': `${SITE_URL}/#org` } });
  return (
    <section className="wrap sec narrow page-static">
      <JsonLd graph={graph} />
      <h1 className="h-xl"><span className="underline-squiggle">{r.title}</span></h1>
      {p.image && <Pasteup src={mediaUrl(p.image)} cls="pasteup-static" />}
      <Prose src={tr(p, 'body', lang)} />
      {r.key === 'about' && <Team lang={lang} />}
    </section>
  );
}

async function Team({ lang }) {
  const t = tFor(lang);
  const team = await C.getTeam();
  if (!team.length) return null;
  const initials = (n) => n.trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('');
  return (
    <div className="team">
      <h2 className="h-lg">{t('team')}</h2>
      <ul className="team-list">
        {team.map((m) => (
          <li key={m.id} className="member">
            {m.photo ? <img className="member-photo" src={mediaUrl(m.photo)} alt="" loading="lazy" /> : <span className="member-photo member-initials" aria-hidden="true">{initials(m.name)}</span>}
            <div>
              <p className="member-role">{tr(m, 'role', lang)}</p>
              <h3>{m.name}</h3>
              {tr(m, 'body', lang) && <Prose src={tr(m, 'body', lang)} />}
              {m.email && <p><a href={`mailto:${m.email}`}>{m.email}</a></p>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Partners picked on this book / event / news item. Hidden when none. */
async function ItemPartners({ ids, lang }) {
  const t = tFor(lang);
  const ps = await C.getPartnersByIds(ids);
  if (!ps.length) return null;
  return (
    <aside className="partners-strip" aria-label={t('partners')}>
      <div className="wrap">
        <p className="kicker">{t('partners')}</p>
        <ul>
          {ps.map((p) => {
            const inner = p.logo ? <img src={mediaUrl(p.logo)} alt={p.name} loading="lazy" /> : <span>{p.name}</span>;
            return <li key={p.id}>{p.url ? <a href={p.url} target="_blank" rel="noopener" title={p.name}>{inner}</a> : inner}</li>;
          })}
        </ul>
      </div>
    </aside>
  );
}

export async function Books({ lang }) {
  const t = tFor(lang);
  const [s, books, qrBooks] = await Promise.all([C.getSettings(), C.getBooks(), C.getQrBookIds()]);
  return (
    <section className="wrap sec">
      <h1 className="h-xl"><span className="underline-squiggle">{t('books')}</span></h1>
      {books.length ? <div className="grid grid-3">{books.map((b, i) => <BookCard key={b.id} b={b} i={i} lang={lang} hasQr={qrBooks.has(b.id)} siteName={s.site_name} />)}</div> : <Empty lang={lang} />}
    </section>
  );
}

export async function Book({ lang, r }) {
  const t = tFor(lang);
  const b = r.data;
  const [s, qrs] = await Promise.all([C.getSettings(), C.getBookQrs(b.id)]);
  const meta = ['author', 'translator', 'publisher', 'year', 'isbn'].filter((f) => b[f]);
  const schema = { '@type': 'Book', name: tr(b, 'title', lang), inLanguage: ['pl', 'fr'], url: SITE_URL + url('books', lang, b.slug), sponsor: { '@id': `${SITE_URL}/#org` } };
  if (b.author) schema.author = { '@type': 'Person', name: b.author };
  if (b.translator) schema.translator = { '@type': 'Person', name: b.translator };
  if (b.publisher) schema.publisher = { '@type': 'Organization', name: b.publisher };
  if (b.isbn) schema.isbn = b.isbn;
  if (b.cover) schema.image = mediaUrl(b.cover);
  if (b.buy_url) schema.offers = { '@type': 'Offer', url: b.buy_url };
  return (
    <>
      <JsonLd graph={[schema, orgSchema(s, lang)]} />
      <section className="wrap sec">
        <p><a className="link-arrow" href={url('books', lang)}>← {t('books')}</a></p>
        <div className="book-hero">
          <div className="book-cover-col"><div className="pasteup"><span className="tape tape-a"></span><span className="tape tape-b"></span><BookCover b={b} lang={lang} cls="cover-lg" siteName={s.site_name} /></div></div>
          <div className="book-info">
            {tr(b, 'badge', lang) && <span className="sticker sticker-inline">{tr(b, 'badge', lang)}</span>}
            {b.author && <p className="kicker">{b.author}</p>}
            <h1 className="h-xl">{tr(b, 'title', lang)}</h1>
            {tr(b, 'subtitle', lang) && <p className="lead">{tr(b, 'subtitle', lang)}</p>}
            <Prose src={tr(b, 'body', lang)} />
            {meta.length > 0 && <dl className="meta">{meta.map((f) => <div key={f}><dt>{t(f)}</dt><dd>{b[f]}</dd></div>)}</dl>}
            {b.buy_url && <p><a className="btn btn-red btn-lg" href={b.buy_url} target="_blank" rel="noopener">{t('buy')} ↗</a></p>}
          </div>
        </div>
      </section>
      {qrs.length > 0 && (
        <section className="band band-blue"><div className="wrap sec">
          <SectionHead title={t('qr_materials')} tag="QR" />
          <p className="lead">{t('qr_intro')}</p>
          <ol className="qr-list">
            {qrs.map((q, i) => (
              <li key={q.code}><a href={`/qr/${encodeURIComponent(q.code)}?lang=${lang}&nocount=1`}>
                <span className="qr-num">{String(i + 1).padStart(2, '0')}</span><span>{tr(q, 'title', lang)}</span><span className="qr-go" aria-hidden="true">▶</span>
              </a></li>
            ))}
          </ol>
        </div></section>
      )}
      <ItemPartners ids={b.partner_ids} lang={lang} />
    </>
  );
}

export async function Events({ lang, r }) {
  const t = tFor(lang);
  const cat = r.key === 'shows' ? 'show' : r.key === 'meetings' ? 'meeting' : null;
  const { up, past } = C.splitEvents(await C.getEvents(cat));
  return (
    <section className="wrap sec">
      <EventsTabs active={r.key} lang={lang} />
      <h1 className="h-xl">{t(r.key)}</h1>
      {!up.length && !past.length && <Empty lang={lang} />}
      {up.length > 0 && <><h2 className="h-md"><span className="tag">{t('upcoming')}</span></h2><div className="grid grid-3">{up.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} lang={lang} />)}</div></>}
      {past.length > 0 && <><h2 className="h-md mt"><span className="tag tag-ink">{t('past')}</span></h2><div className="grid grid-3 is-past">{past.map((ev, i) => <EventCard key={ev.id} ev={ev} i={i} lang={lang} />)}</div></>}
    </section>
  );
}

export function Event({ lang, r }) {
  const t = tFor(lang);
  const ev = r.data;
  const label = ev.category === 'show' ? t('shows') : ev.category === 'meeting' ? t('meetings') : t('events');
  const schema = { '@type': 'Event', name: tr(ev, 'title', lang), organizer: { '@id': `${SITE_URL}/#org` }, description: excerpt(tr(ev, 'body', lang), 300) };
  if (ev.starts_at) schema.startDate = String(ev.starts_at).replace(' ', 'T');
  if (ev.place) schema.location = { '@type': 'Place', name: ev.place };
  if (ev.image) schema.image = mediaUrl(ev.image);
  let host = ev.link; try { host = new URL(ev.link).hostname; } catch { /* keep raw */ }
  return (
    <>
    <article className="wrap sec narrow">
      <JsonLd graph={[schema]} />
      <EventsTabs active={r.key} lang={lang} />
      <p className={`label label-${ev.category}`}>{label}</p>
      <h1 className="h-xl">{tr(ev, 'title', lang)}</h1>
      <dl className="meta meta-inline">
        {ev.starts_at && <div><dt>{t('date')}</dt><dd>{fmtDate(ev.starts_at, lang)}</dd></div>}
        {ev.place && <div><dt>{t('place')}</dt><dd>{ev.place}</dd></div>}
      </dl>
      {ev.image && <Pasteup src={mediaUrl(ev.image)} />}
      <Prose src={tr(ev, 'body', lang)} />
      {ev.link && <p><a className="btn btn-red" href={ev.link} target="_blank" rel="noopener">↗ {host}</a></p>}
      <p><a className="link-arrow" href={url(r.key, lang)}>← {t('back')}</a></p>
    </article>
    <ItemPartners ids={ev.partner_ids} lang={lang} />
    </>
  );
}

export async function Partners({ lang }) {
  const t = tFor(lang);
  const ps = await C.getPartners();
  return (
    <section className="wrap sec">
      <EventsTabs active="partners" lang={lang} />
      <h1 className="h-xl">{t('partners')}</h1>
      {!ps.length ? <Empty lang={lang} /> : (
        <div className="partners">
          {ps.map((p, i) => {
            const inner = <>{p.logo ? <img src={mediaUrl(p.logo)} alt={p.name} loading="lazy" /> : <span className="partner-name">{p.name}</span>}<div><h3>{p.name}</h3><Html html={md(tr(p, 'body', lang))} /></div></>;
            return p.url ? <a key={p.id} className={`partner tilt-${i % 3}`} href={p.url} target="_blank" rel="noopener">{inner}</a> : <div key={p.id} className={`partner tilt-${i % 3}`}>{inner}</div>;
          })}
        </div>
      )}
    </section>
  );
}

export async function News({ lang }) {
  const t = tFor(lang);
  const news = await C.getNews();
  return (
    <section className="wrap sec">
      <h1 className="h-xl"><span className="underline-squiggle">{t('news')}</span></h1>
      {news.length ? <div className="grid grid-3">{news.map((n, i) => <NewsCard key={n.id} n={n} i={i} lang={lang} />)}</div> : <Empty lang={lang} />}
    </section>
  );
}

export function NewsItem({ lang, r }) {
  const t = tFor(lang);
  const n = r.data;
  return (
    <>
    <article className="wrap sec narrow">
      <JsonLd graph={[{ '@type': 'NewsArticle', headline: tr(n, 'title', lang), datePublished: n.date, publisher: { '@id': `${SITE_URL}/#org` }, inLanguage: lang }]} />
      <p className="kicker">{fmtDate(n.date, lang)}</p>
      <h1 className="h-xl">{tr(n, 'title', lang)}</h1>
      {n.image && <Pasteup src={mediaUrl(n.image)} />}
      <Prose src={tr(n, 'body', lang)} />
      <p><a className="link-arrow" href={url('news', lang)}>← {t('all_news')}</a></p>
    </article>
    <ItemPartners ids={n.partner_ids} lang={lang} />
    </>
  );
}

export async function Support({ lang, r }) {
  const t = tFor(lang);
  const s = await C.getSettings();
  const rows = [];
  if (s.bank_name) rows.push([t('bank'), s.bank_name, false]);
  if (s.bank_account) rows.push([t('account'), s.bank_account, true]);
  if (s.iban_swift) rows.push(['IBAN / SWIFT', s.iban_swift, true]);
  rows.push([t('title_transfer'), t('transfer_title'), true]);
  if (s.krs) rows.push([t('krs'), s.krs, true]);
  return (
    <section className="wrap sec">
      <JsonLd graph={[orgSchema(s, lang)]} />
      <div className="support-grid">
        <div>
          <h1 className="h-xl"><span className="underline-squiggle">{r.title}</span></h1>
          <Prose src={tr(r.data, 'body', lang)} />
        </div>
        <div className="bank-card pasteup">
          <span className="tape tape-a"></span>
          <h2 className="h-md">{t('bank')}</h2>
          <p className="bank-name">{s.site_name}</p>
          {s.address && <p className="muted">{s.address}</p>}
          <dl className="bank-rows">
            {rows.map(([k, v, copy]) => (
              <div key={k}><dt>{k}</dt><dd><span className="mono">{v}</span>{copy && <> <button type="button" className="copy" data-copy={v} data-done={t('copied')}>{t('copy')}</button></>}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}

export async function Contact({ lang, r }) {
  const s = await C.getSettings();
  return (
    <section className="wrap sec">
      <JsonLd graph={[{ '@type': 'ContactPage', about: { '@id': `${SITE_URL}/#org` } }, orgSchema(s, lang)]} />
      <div className="contact-grid">
        <div>
          <h1 className="h-xl"><span className="underline-squiggle">{r.title}</span></h1>
          <Prose src={tr(r.data, 'body', lang)} />
          <ul className="contact-list">
            {s.email && <li><span>✉</span><a href={`mailto:${s.email}`}>{s.email}</a></li>}
            {s.phone && <li><span>☎</span><a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`}>{s.phone}</a></li>}
            {s.address && <li><span>⌂</span>{s.address}</li>}
          </ul>
          <Socials s={s} lang={lang} />
        </div>
        <ContactForm lang={lang} />
      </div>
    </section>
  );
}

export function NotFoundBody({ lang }) {
  const t = tFor(lang);
  return (
    <section className="wrap sec page-404">
      <div className="tag-wall"><span className="spray">404</span></div>
      <h1 className="h-xl">{t('not_found')}</h1>
      <p className="lead">{t('not_found_txt')}</p>
      <p><a className="btn" href={url('home', lang)}>{t('go_home')}</a></p>
    </section>
  );
}

export function QrBody({ lang, q, book, siblings }) {
  const t = tFor(lang);
  const idx = siblings.findIndex((x) => x.code === q.code);
  const media = mediaInfo(q[`media_${lang}`] || q[`media_${lang === 'pl' ? 'fr' : 'pl'}`]);
  const link = (c) => `/qr/${encodeURIComponent(c)}?lang=${lang}&nocount=1`;
  return (
    <article className="wrap sec narrow qr-page" lang={lang}>
      {book && <p className="kicker">{t('from_book')}: <a href={url('books', lang, book.slug)}>{tr(book, 'title', lang)}</a></p>}
      <p className="qr-stamp"><span>QR</span>{idx >= 0 ? String(idx + 1).padStart(2, '0') : q.code}</p>
      <h1 className="h-xl">{tr(q, 'title', lang)}</h1>
      {media?.kind === 'iframe' && <div className="embed"><iframe src={media.src} title={tr(q, 'title', lang)} loading="lazy" allow="accelerometer; encrypted-media; picture-in-picture; fullscreen" allowFullScreen></iframe></div>}
      {media?.kind === 'audio' && <audio className="audio" controls preload="none" src={media.src}></audio>}
      {media?.kind === 'video' && <div className="embed"><video controls preload="metadata" src={media.src}></video></div>}
      {media?.kind === 'link' && <p><a className="btn" href={media.src} target="_blank" rel="noopener">▶ {tr(q, 'title', lang)}</a></p>}
      {q.image && <Pasteup src={mediaUrl(q.image)} />}
      <Prose src={tr(q, 'body', lang)} />
      {idx >= 0 && siblings.length > 1 && (
        <nav className="qr-nav">
          {idx > 0 ? <a className="btn btn-ghost" href={link(siblings[idx - 1].code)}>← {tr(siblings[idx - 1], 'title', lang)}</a> : <span></span>}
          {idx < siblings.length - 1 && <a className="btn btn-ghost" href={link(siblings[idx + 1].code)}>{tr(siblings[idx + 1], 'title', lang)} →</a>}
        </nav>
      )}
    </article>
  );
}
