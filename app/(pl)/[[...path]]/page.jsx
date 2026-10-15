import RoutePage, { routeMetadata } from '@/components/RoutePage';

export const revalidate = 300; // pages refresh at least every 5 min; saving in the panel refreshes them immediately
export const dynamicParams = true;
// Pages render on first visit and are then cached (ISR); the panel purges the cache on every save.
export async function generateStaticParams() { return []; }

export async function generateMetadata({ params }) {
  const { path } = await params;
  return routeMetadata('pl', path);
}
export default async function Page({ params }) {
  const { path } = await params;
  return <RoutePage lang="pl" path={path} />;
}
