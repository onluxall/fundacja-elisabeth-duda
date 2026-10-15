import { notFound, permanentRedirect } from 'next/navigation';
import { resolve, metaFor } from '@/lib/route';
import SiteShell from './SiteShell';
import * as P from './pages';

export async function routeMetadata(lang, path) {
  return metaFor(lang, await resolve(lang, path));
}

export default async function RoutePage({ lang, path }) {
  const r = await resolve(lang, path);
  if (!r) notFound();
  if (r.redirect) permanentRedirect(r.redirect);
  const props = { lang, r };
  const body = {
    home: () => <P.Home {...props} />,
    about: () => <P.StaticPage {...props} />,
    support: () => <P.Support {...props} />,
    contact: () => <P.Contact {...props} />,
    books: () => (r.slug ? <P.Book {...props} /> : <P.Books {...props} />),
    events: () => (r.slug ? <P.Event {...props} /> : <P.Events {...props} />),
    shows: () => (r.slug ? <P.Event {...props} /> : <P.Events {...props} />),
    meetings: () => (r.slug ? <P.Event {...props} /> : <P.Events {...props} />),
    partners: () => <P.Partners {...props} />,
    news: () => (r.slug ? <P.NewsItem {...props} /> : <P.News {...props} />),
  }[r.key];
  return <SiteShell lang={lang} nav={r.nav} alt={r.alt}>{body()}</SiteShell>;
}
