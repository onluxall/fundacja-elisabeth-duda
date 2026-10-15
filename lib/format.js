import { SUPABASE_URL, BUCKET } from './config';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Field in the current language, falling back to the other one. */
export function tr(row, field, lang) {
  if (!row) return '';
  const v = String(row[`${field}_${lang}`] ?? '').trim();
  return v || String(row[`${field}_${lang === 'pl' ? 'fr' : 'pl'}`] ?? '').trim();
}

/** Stored media value → URL. Values are either full URLs or paths inside the Storage bucket. */
export function mediaUrl(v) {
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${String(v).split('/').map(encodeURIComponent).join('/')}`;
}

/** Tiny safe Markdown: ## headings, **bold**, *italic*, [link](url), - lists, > quotes, paragraphs. Escapes first. */
export function md(src) {
  src = String(src ?? '').replace(/\r\n/g, '\n').trim();
  if (!src) return '';
  const inline = (t) => {
    t = esc(t);
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, u) => {
      const url = u.replace(/&amp;/g, '&');
      if (!/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url)) return m;
      const ext = /^https?:\/\//i.test(url) ? ' target="_blank" rel="noopener"' : '';
      return `<a href="${esc(url)}"${ext}>${txt}</a>`;
    });
    t = t.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*\w])\*(?!\s)(.+?)(?<!\s)\*(?![*\w])/g, '$1<em>$2</em>');
    return t.replace(/\n/g, '<br>');
  };
  return src.split(/\n{2,}/).map((block) => {
    const lines = block.split('\n');
    const h = block.match(/^(#{2,3})\s+(.*)$/);
    if (h && lines.length === 1) return `<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`;
    if (lines.every((l) => /^\s*[-•]\s+/.test(l))) return '<ul>' + lines.map((l) => `<li>${inline(l.replace(/^\s*[-•]\s+/, ''))}</li>`).join('') + '</ul>';
    if (lines.every((l) => l.startsWith('>'))) return `<blockquote>${inline(lines.map((l) => l.slice(1).trimStart()).join('\n'))}</blockquote>`;
    return `<p>${inline(block)}</p>`;
  }).join('');
}

export function excerpt(s, n = 180) {
  const t = String(s ?? '').replace(/\(https?:[^)]+\)/g, '').replace(/[#*>\[\]]/g, '').replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n).trimEnd() + '…' : t;
}

const MON = {
  pl: ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia'],
  fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
};
/** Dates are stored as wall-clock Warsaw time without zone; parse the parts directly to avoid timezone shifts. */
export function parts(d) {
  const m = String(d ?? '').match(/^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2}))?/);
  return m ? { y: +m[1], mo: +m[2], d: +m[3], h: m[4] ? +m[4] : null, mi: m[5] ? +m[5] : null } : null;
}
export function fmtDate(d, lang = 'pl') {
  const p = parts(d);
  if (!p) return '';
  let s = `${p.d} ${MON[lang][p.mo - 1]} ${p.y}`;
  if (p.h !== null && (p.h || p.mi)) s += `, ${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
  return s;
}

export function slugify(s) {
  const map = { ą: 'a', ć: 'c', ę: 'e', ł: 'l', ń: 'n', ó: 'o', ś: 's', ź: 'z', ż: 'z', à: 'a', â: 'a', ä: 'a', ç: 'c', é: 'e', è: 'e', ê: 'e', ë: 'e', î: 'i', ï: 'i', ô: 'o', ö: 'o', ù: 'u', û: 'u', ü: 'u', ÿ: 'y', œ: 'oe', æ: 'ae' };
  const out = String(s ?? '').toLowerCase().replace(/[^\u0000-\u007f]/g, (c) => map[c] ?? '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  return out || 'wpis';
}

/** YouTube / Vimeo / audio / video / PDF → { kind, src } */
export function mediaInfo(v) {
  const u = String(v ?? '').trim();
  if (!u) return null;
  let m;
  if ((m = u.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/))) return { kind: 'iframe', src: `https://www.youtube-nocookie.com/embed/${m[1]}` };
  if ((m = u.match(/vimeo\.com\/(?:video\/)?(\d+)/))) return { kind: 'iframe', src: `https://player.vimeo.com/video/${m[1]}` };
  const src = mediaUrl(u);
  if (/\.(mp3|m4a|ogg|wav)(\?|$)/i.test(u)) return { kind: 'audio', src };
  if (/\.(mp4|webm)(\?|$)/i.test(u)) return { kind: 'video', src };
  return { kind: 'link', src };
}
