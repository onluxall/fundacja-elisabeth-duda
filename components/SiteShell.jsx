import { url, tFor } from '@/lib/i18n';
import { getSettings } from '@/lib/content';
import ClientUI from './ClientUI';

export function Socials({ s, lang, cls = '' }) {
  const t = tFor(lang);
  const list = [['facebook', 'Facebook'], ['linkedin', 'LinkedIn'], ['instagram', 'Instagram'], ['youtube', 'YouTube']].filter(([k]) => s[k]);
  if (!list.length) return null;
  return (
    <div className={`socials ${cls}`}>
      <span className="socials-label">{t('follow')}</span>
      {list.map(([k, label]) => <a key={k} className={`social social-${k}`} href={s[k]} target="_blank" rel="noopener">{label}</a>)}
    </div>
  );
}

/**
 * Header + footer around every public page.
 * @param alt {pl, fr} — the same page in the other language (for the switcher)
 */
export default async function SiteShell({ lang, nav = '', alt, children }) {
  const s = await getSettings();
  const t = tFor(lang);
  const other = lang === 'pl' ? 'fr' : 'pl';
  alt = alt || { pl: url('home', 'pl'), fr: url('home', 'fr') };
  const items = ['about', 'events', 'news', 'support', 'contact'];

  return (
    <>
      <a className="skip" href="#main">{t('skip')}</a>
      <header className="site-head">
        <div className="wrap head-row">
          <a className="brand" href={url('home', lang)} aria-label={s.site_name}>
            <img src="/assets/img/logo-color.svg" alt={s.site_name} width="230" height="50" />
          </a>
          <button className="menu-btn" type="button" aria-expanded="false" aria-controls="menu">
            <span className="menu-ico" aria-hidden="true"></span><span className="sr">{t('menu')}</span>
          </button>
          <nav className="menu" id="menu" aria-label="Menu">
            <ul>
              {items.map((k) => k === 'events' ? (
                <li key={k} className={`has-sub${nav === 'events' ? ' is-active' : ''}`}>
                  <a href={url('events', lang)} aria-current={nav === 'events' ? 'page' : undefined}>{t('events')}</a>
                  <button className="sub-toggle" type="button" aria-expanded="false" aria-label={t('events')}>▾</button>
                  <ul className="sub">
                    {['books', 'shows', 'meetings', 'partners'].map((x) => <li key={x}><a href={url(x, lang)}>{t(x)}</a></li>)}
                  </ul>
                </li>
              ) : (
                <li key={k} className={`${nav === k ? 'is-active' : ''}${k === 'support' ? ' nav-support' : ''}`}>
                  <a href={url(k, lang)} aria-current={nav === k ? 'page' : undefined}>{t(k)}</a>
                </li>
              ))}
            </ul>
            <div className="lang-switch">
              <a href={alt.pl} hrefLang="pl" lang="pl" aria-current={lang === 'pl' ? 'true' : undefined}>PL</a>
              <a href={alt.fr} hrefLang="fr" lang="fr" aria-current={lang === 'fr' ? 'true' : undefined}>FR</a>
            </div>
          </nav>
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="site-foot">
        <div className="foot-spray" aria-hidden="true"></div>
        <div className="wrap foot-grid">
          <div>
            <img className="foot-logo" src="/assets/img/logo-dark.svg" alt={s.site_name} width="260" height="56" />
            <p className="foot-tag">“{s.tagline}”</p>
            <Socials s={s} lang={lang} cls="socials-foot" />
          </div>
          <div>
            <h2 className="foot-h">{t('events')}</h2>
            <ul className="foot-links">{['books', 'shows', 'meetings', 'partners'].map((x) => <li key={x}><a href={url(x, lang)}>{t(x)}</a></li>)}</ul>
          </div>
          <div>
            <h2 className="foot-h">{s.site_name}</h2>
            <ul className="foot-links">{['about', 'news', 'support', 'contact'].map((x) => <li key={x}><a href={url(x, lang)}>{t(x)}</a></li>)}</ul>
            <p className="foot-legal">
              {s.krs && <>KRS {s.krs}<br /></>}
              {s.nip && <>NIP {s.nip}<br /></>}
              {s.email && <a href={`mailto:${s.email}`}>{s.email}</a>}
            </p>
          </div>
        </div>
        <div className="wrap foot-bottom">
          <span>© {new Date().getFullYear()} {s.site_name}</span>
          <a href={alt[other]} hrefLang={other}>{t('lang_other')}</a>
        </div>
      </footer>
      <ClientUI />
    </>
  );
}
