import AdminApp from '@/components/admin/AdminApp';
export default async function Page({ params }) {
  const { path } = await params;
  return <AdminApp path={path || []} />;
}
