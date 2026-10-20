// Public values only. The publishable key is safe in the browser; data is protected by Row Level Security.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tnzebiogrfetkbgalwnk.supabase.co';
export const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_KEY || 'sb_publishable_U0_mTxxyPqF7drBonw-D-Q_S4wPwE_z';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'https://fundacja-ed.com').replace(/\/$/, '');
export const BUCKET = 'media';
