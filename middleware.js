import { NextResponse } from 'next/server';

/**
 * Admin panel lives on its own subdomain: admin.fundacja-ed.com
 *  - admin.<domain>/books      → served from /admin/books (internal rewrite)
 *  - admin.<domain>/admin/...  → 308 to the clean URL
 *  - <domain>/admin/...        → 308 to admin.<domain>/...  (panel is not reachable on the public site)
 *  - *.vercel.app and localhost keep /admin as a fallback (previews, local dev).
 * Every admin response gets strict security headers and is never cached or indexed.
 */
const PUBLIC_HOSTS = new Set(['fundacja-ed.com', 'www.fundacja-ed.com']);
const ADMIN_HOST = 'admin.fundacja-ed.com';
const PASS = /^\/(_next|assets|api|favicon\.ico|icon|apple-icon)/;

const SECURITY = {
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'X-Frame-Options': 'DENY',
  'Content-Security-Policy': "frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'",
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains',
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cache-Control': 'no-store, max-age=0',
};
const secure = (res) => { for (const [k, v] of Object.entries(SECURITY)) res.headers.set(k, v); return res; };

export function middleware(req) {
  const host = (req.headers.get('host') || '').split(':')[0].toLowerCase();
  const { pathname, search } = req.nextUrl;

  if (host === ADMIN_HOST || host.startsWith('admin.')) {
    if (pathname === '/robots.txt') return secure(new NextResponse('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } }));
    if (PASS.test(pathname)) return secure(NextResponse.next());
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const u = req.nextUrl.clone(); u.pathname = pathname.slice(6) || '/'; return NextResponse.redirect(u, 308);
    }
    const u = req.nextUrl.clone(); u.pathname = '/admin' + (pathname === '/' ? '' : pathname);
    return secure(NextResponse.rewrite(u));
  }

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (PUBLIC_HOSTS.has(host)) return NextResponse.redirect(`https://${ADMIN_HOST}${pathname.slice(6) || '/'}${search}`, 308);
    return secure(NextResponse.next()); // preview / local fallback
  }
  return NextResponse.next();
}

export const config = { matcher: ['/((?!_next/static|_next/image).*)'] };
