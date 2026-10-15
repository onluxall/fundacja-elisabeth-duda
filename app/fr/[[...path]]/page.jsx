import RoutePage, { routeMetadata } from '@/components/RoutePage';

export const revalidate = 300;
export const dynamicParams = true;
// Pages render on first visit and are then cached (ISR); the panel purges the cache on every save.
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }) {
  const { path } = await params;
  return routeMetadata('fr', path);
}
export default async function Page({ params }) {
  const { path } = await params;
  return <RoutePage lang="fr" path={path} />;
}
