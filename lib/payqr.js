// Bank-transfer QR codes for donations. Pure JS — used by the public page (server) and the panel (browser).
// PLN: Polish banks' QR standard (ZBP) — one line, fields separated by "|", read by "Skanuj kod QR" in Polish banking apps.
// EUR: a plain link to the French donation page (IBAN + copy button). Most French banking apps can't read
// EPC/SEPA codes, so the link works for every donor. eurPayload() (EPC) is kept for possible later use.
// The PLN code leaves the amount empty: the donor types it in the app.
import qrcode from 'qrcode-generator';

export const DON_DEFAULTS = {
  don_recipient: 'Fundacja Elisabeth Duda',
  don_qr_name: 'Fundacja E. Duda',
  don_title_pln: 'Darowizna na cele statutowe',
  don_title_eur: 'Darowizna na cele statutowe / Don',
};
export const donVal = (s, k) => String(s?.[k] ?? '').trim() || DON_DEFAULTS[k] || '';

export const compact = (v) => String(v || '').replace(/[\s-]+/g, '').toUpperCase();

/** "PL49160014621710304460000001" → "PL49 1600 1462 1710 3044 6000 0001" */
export const fmtIban = (v) => compact(v).replace(/(.{4})(?=.)/g, '$1 ');

/** IBAN checksum (ISO 13616, mod 97). Accepts spaces. */
export function validIban(v) {
  const s = compact(v);
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{10,30}$/.test(s)) return false;
  const r = s.slice(4) + s.slice(0, 4);
  let m = 0;
  for (const ch of r) { const d = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55); for (const x of d) m = (m * 10 + Number(x)) % 97; }
  return m === 1;
}
/** Polish account: 26 digits (NRB), optionally prefixed with PL. */
export function plAccount(v) {
  let s = compact(v);
  if (/^\d{26}$/.test(s)) s = 'PL' + s;
  return /^PL\d{26}$/.test(s) && validIban(s) ? s : null;
}
export const validBic = (v) => /^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(compact(v));

const clean = (v, max) => String(v || '').replace(/[|\r\n]+/g, ' ').trim().slice(0, max);

/** ZBP payload: NIP|PL|account(26)|amount(6, grosze)|name(20)|title(32)|||  — amount 000000 = donor enters it. */
export function plnPayload({ account, name, title }) {
  const acc = plAccount(account);
  if (!acc) return null;
  return ['', 'PL', acc.slice(2), '000000', clean(name, 20), clean(title, 32), '', '', ''].join('|');
}

/** EPC payload (version 002 — BIC optional in the EEA, UTF-8). Amount left empty. */
export function eurPayload({ iban, bic, name, title }) {
  const ib = compact(iban);
  if (!validIban(ib)) return null;
  const b = validBic(bic) ? compact(bic) : '';
  return ['BCD', '002', '1', 'SCT', b, clean(name, 70), ib, '', '', '', clean(title, 140)].join('\n');
}

/** QR matrix → { n, isDark }. EPC guidelines ask for error correction level M. */
export function qrMatrix(text) {
  const q = qrcode(0, 'M'); q.addData(text, 'Byte'); q.make();
  return { n: q.getModuleCount(), isDark: (r, c) => q.isDark(r, c) };
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * QR as SVG. With `caption` lines it becomes a print file: code on top, text centred underneath.
 * caption: [{ text, size?, bold? }]
 */
export function qrSvg(text, { caption = [], color = '#15161c' } = {}) {
  const { n, isDark } = qrMatrix(text);
  const m = 4, w = n + m * 2;
  const fsOf = (l) => (l.size || 1) * w * 0.062;
  // Widen the canvas when a caption line is longer than the code (rough Arial width estimate).
  const textW = Math.max(0, ...caption.map((l) => String(l.text).length * fsOf(l) * (l.bold ? 0.6 : 0.55)));
  const W = Math.max(w, textW + w * 0.12), ox = (W - w) / 2;
  let d = '';
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
  let y = w, lines = '';
  for (const l of caption) {
    const fs = fsOf(l);
    y += fs * 1.35;
    lines += `<text x="${(W / 2).toFixed(2)}" y="${y.toFixed(2)}" font-family="Arial, Helvetica, sans-serif" font-size="${fs.toFixed(2)}"${l.bold ? ' font-weight="700"' : ''} text-anchor="middle" fill="${color}">${esc(l.text)}</text>`;
  }
  const h = caption.length ? y + w * 0.06 : w;
  const qr = ox ? `<path fill="${color}" transform="translate(${ox.toFixed(2)} 0)" d="${d}"/>` : `<path fill="${color}" d="${d}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W.toFixed(2)} ${h.toFixed(2)}" shape-rendering="crispEdges"><rect width="${W.toFixed(2)}" height="${h.toFixed(2)}" fill="#fff"/>${qr}${lines}</svg>`;
}

export const EUR_ANCHOR = 'don-eur';
/** Where the EUR code points: the French donation page, scrolled to the EUR account. */
export const eurLink = (s) => `${String(s?.qr_base || 'https://fundacja-ed.com').replace(/\/$/, '')}/fr/soutenir-la-fondation#${EUR_ANCHOR}`;

/** Everything the page and the panel need, from settings. Missing / invalid accounts → null. */
export function donationCodes(s) {
  const name = donVal(s, 'don_recipient');
  const pln = plnPayload({ account: s?.bank_account, name: donVal(s, 'don_qr_name'), title: donVal(s, 'don_title_pln') });
  const eur = validIban(s?.don_eur_iban) ? eurLink(s) : null; // link QR, see the note at the top
  return {
    pln: pln && { payload: pln, account: fmtIban(plAccount(s.bank_account)) },
    eur: eur && { payload: eur, account: fmtIban(s.don_eur_iban) },
  };
}
