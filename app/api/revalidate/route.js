import { revalidatePath } from 'next/cache';
import { dbAs } from '@/lib/supabase';

/** Called by the panel after every save: verifies the caller is an admin, then refreshes all public pages. */
export async function POST(req) {
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!token) return Response.json({ ok: false }, { status: 401 });
  const { data, error } = await dbAs(token).rpc('is_admin');
  if (error || data !== true) return Response.json({ ok: false }, { status: 403 });
  revalidatePath('/', 'layout');
  revalidatePath('/fr', 'layout');
  return Response.json({ ok: true });
}
