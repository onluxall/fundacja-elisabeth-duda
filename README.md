# Fundacja Elisabeth Duda — fundacja-ed.com

Next.js 15 (App Router) on Vercel + Supabase (Postgres, Storage, Auth). PL at `/`, FR at `/fr`. Street-art paste-up design.

| Path | What |
|---|---|
| `app/(pl)/[[...path]]`, `app/fr/[[...path]]` | public pages (ISR, 5 min; purged on every panel save) |
| `app/(pl)/qr/[code]` | the URL printed in books — counts scans, never cached |
| `app/(admin)/admin/[[...path]]` | panel (client-side, Supabase Auth + RLS) |
| `app/api/revalidate` | panel calls this after saving; verifies admin, purges cache |
| `lib/route.js` | URL → page resolution + metadata (canonical, hreflang) |
| `components/admin/entities.js` | content types — the panel screens are generated from these |
| `public/assets` | CSS, logos |

## Supabase

Project `fundacja-elisabeth-duda` (eu-central-1). All tables have RLS: public read of published rows, writes only for users in `public.admins`. Media in the public `media` bucket.

**First admin:** open `/admin` → *Utwórz konto* → confirm the e-mail → log in → enter the setup key (stored in `public.private_config`, not readable through the API). Works only while `admins` is empty.
**More people:** they create an account at `/admin`; an admin approves them in *Konta i hasło*.

Set in Supabase → Authentication → URL Configuration: **Site URL** = `https://fundacja-ed.com`, and add `https://fundacja-ed.com/admin` + the Vercel preview URL to **Redirect URLs** (needed for e-mail confirmation and password reset links).

## Env (optional — public defaults are in `lib/config.js`)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_KEY`, `NEXT_PUBLIC_SITE_URL`.

## Local

```bash
npm install && npm run dev
```
