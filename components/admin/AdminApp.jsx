'use client';
import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import qrcode from 'qrcode-generator';
import { sb } from '@/lib/browser';
import { mediaUrl, slugify, fmtDate, excerpt } from '@/lib/format';
import { ENTITIES, flatFields, PAGES, SETTINGS, MD_HELP } from './entities';

// On admin.fundacja-ed.com the panel sits at the root; elsewhere (previews, local) under /admin.
// Only evaluated client-side after the session check, so server and client markup never differ.
const onAdminHost = () => typeof window !== 'undefined' && window.location.hostname.startsWith('admin.');
const A = (p = '') => (onAdminHost() ? '' : '/admin') + (p ? '/' + p : '') || '/';
// Links from the panel to the public site must leave the admin subdomain.
const PUB = (path = '/') => (onAdminHost() ? window.location.origin.replace('//admin.', '//') : '') + path;

/* ------------------------------------------------------------------ helpers */

async function refreshSite() {
  try {
    const { data } = await sb().auth.getSession();
    const token = data.session?.access_token;
    if (token) await fetch('/api/revalidate', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
  } catch { /* the site still refreshes on its own within 5 minutes */ }
}

/** Downscale big images in the browser before upload (max 2000px), keep others as-is. */
async function shrink(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return file;
  try {
    const bmp = await createImageBitmap(file);
    const max = 2000, k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (k === 1) return file;
    const c = document.createElement('canvas');
    c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const blob = await new Promise((r) => c.toBlob(r, file.type === 'image/png' ? 'image/png' : 'image/jpeg', 0.85));
    return blob ? new File([blob], file.name, { type: blob.type }) : file;
  } catch { return file; }
}

async function uploadFile(file, folder) {
  const f = await shrink(file);
  const ext = (f.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const base = slugify(f.name.replace(/\.[^.]+$/, '')).slice(0, 40);
  const path = `${folder}/${base}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await sb().storage.from('media').upload(path, f, { contentType: f.type || undefined, upsert: false });
  if (error) throw new Error(error.message.includes('mime') ? 'Ten typ pliku nie jest dozwolony.' : error.message);
  return path;
}

function useDirtyGuard(dirty) {
  useEffect(() => {
    const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [dirty]);
}

/* ------------------------------------------------------------------ fields */

function MdArea({ value, onChange, id }) {
  const ref = useRef(null);
  const wrap = (before, after = before, ph = 'tekst') => {
    const ta = ref.current; const s = ta.selectionStart, e = ta.selectionEnd;
    const sel = value.slice(s, e) || ph;
    onChange(value.slice(0, s) + before + sel + after + value.slice(e));
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(s + before.length, s + before.length + sel.length); });
  };
  const prefix = (p) => {
    const ta = ref.current; const s = ta.selectionStart, e = ta.selectionEnd;
    const start = value.lastIndexOf('\n', s - 1) + 1;
    const block = value.slice(start, Math.max(e, start)) || 'tekst';
    onChange(value.slice(0, start) + block.split('\n').map((l) => p + l).join('\n') + value.slice(Math.max(e, start)));
    requestAnimationFrame(() => ta.focus());
  };
  const tools = [
    ['B', 'Pogrubienie', () => wrap('**')], ['I', 'Kursywa', () => wrap('*')], ['H', 'Nagłówek', () => prefix('## ')],
    ['• Lista', 'Lista', () => prefix('- ')], ['❝ Cytat', 'Cytat', () => prefix('> ')],
    ['🔗 Link', 'Link', () => { const u = prompt('Adres linku (https://…)', 'https://'); if (u) wrap('[', `](${u})`, 'tekst linku'); }],
  ];
  return (
    <>
      <div className="md-bar">{tools.map(([l, t, fn]) => <button key={l} type="button" title={t} onClick={fn}>{l}</button>)}</div>
      <textarea ref={ref} id={id} rows={9} value={value} onChange={(e) => onChange(e.target.value)} />
    </>
  );
}

/** Tick the partners of one book / event / news item — or add a new partner right here. */
function PartnerPicker({ id, value, set, partners, onCreated, err }) {
  const sel = (Array.isArray(value) ? value : []).map(Number);
  const toggle = (pid, on) => set(on ? [...new Set([...sel, pid])] : sel.filter((x) => x !== pid));
  const [open, setOpen] = useState(false);
  const [np, setNp] = useState({ name: '', url: '', logo: '' });
  const [busy, setBusy] = useState(false);
  const noEnter = (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } };
  const onLogo = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { const path = await uploadFile(file, 'partners'); setNp((x) => ({ ...x, logo: path })); } catch (x) { err(x.message); }
    setBusy(false); e.target.value = '';
  };
  const add = async () => {
    const name = np.name.trim();
    if (!name) return err('Wpisz nazwę partnera.');
    let url = np.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = 'https://' + url;
    setBusy(true);
    const { data, error } = await sb().from('partners').insert({ name, url, logo: np.logo, published: true, sort: 0 }).select('id,name,published').single();
    setBusy(false);
    if (error) return err(error.message);
    onCreated?.(data);
    set([...new Set([...sel, data.id])]);
    setNp({ name: '', url: '', logo: '' }); setOpen(false);
  };
  return (
    <div id={id}>
      <div className="partner-picks">
        {partners.map((p) => (
          <label key={p.id} className="check"><input type="checkbox" checked={sel.includes(p.id)} onChange={(e) => toggle(p.id, e.target.checked)} /> {p.name}{!p.published && <span className="muted"> (ukryty)</span>}</label>
        ))}
        {!partners.length && !open && <p className="muted small">Brak partnerów — dodaj pierwszego poniżej.</p>}
      </div>
      {!open ? (
        <button type="button" className="btn btn-sm btn-ghost" onClick={() => setOpen(true)}>+ Dodaj nowego partnera</button>
      ) : (
        <div className="partner-new">
          <div className="row">
            <div className="fld"><label>Nazwa partnera *</label><input value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} onKeyDown={noEnter} autoFocus /></div>
            <div className="fld"><label>Strona internetowa</label><input type="url" placeholder="https://" value={np.url} onChange={(e) => setNp({ ...np, url: e.target.value })} onKeyDown={noEnter} /></div>
          </div>
          <div className="fld"><label>Logo</label>
            <div className="img-field">
              {np.logo && <img src={mediaUrl(np.logo)} alt="" />}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onLogo} disabled={busy} />
              {busy && <span className="small muted">Wgrywanie…</span>}
            </div>
          </div>
          <p>
            <button type="button" className="btn btn-sm btn-red" onClick={add} disabled={busy}>Dodaj i zaznacz</button>{' '}
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setOpen(false); setNp({ name: '', url: '', logo: '' }); }}>Anuluj</button>
          </p>
        </div>
      )}
    </div>
  );
}

function Field({ f, value, set, books, partners = [], onPartnerCreated, err }) {
  const id = `f_${f.name}`;
  const v = value ?? '';
  const [busy, setBusy] = useState(false);
  const onFile = async (e, folder) => {
    const file = e.target.files?.[0]; if (!file) return;
    setBusy(true);
    try { set(await uploadFile(file, folder)); } catch (x) { err(x.message); }
    setBusy(false); e.target.value = '';
  };
  if (f.kind === 'checkbox') return <label className="check"><input type="checkbox" checked={!!value} onChange={(e) => set(e.target.checked)} /> {f.label}</label>;
  let input;
  switch (f.kind) {
    case 'textarea': input = <MdArea id={id} value={v} onChange={set} />; break;
    case 'select': input = <select id={id} value={v} onChange={(e) => set(e.target.value)}>{Object.entries(f.options).map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>; break;
    case 'partners':
      input = <PartnerPicker id={id} value={value} set={set} partners={partners} onCreated={onPartnerCreated} err={err} />; break;
    case 'book': input = <select id={id} value={v ?? ''} onChange={(e) => set(e.target.value ? Number(e.target.value) : null)}><option value="">— bez książki —</option>{books.map((b) => <option key={b.id} value={b.id}>{b.title_pl}</option>)}</select>; break;
    case 'date': input = <input type="date" id={id} value={v ? String(v).slice(0, 10) : ''} onChange={(e) => set(e.target.value || null)} />; break;
    case 'datetime': input = <input type="datetime-local" id={id} value={v ? String(v).slice(0, 16) : ''} onChange={(e) => set(e.target.value || null)} />; break;
    case 'number': input = <input type="number" id={id} value={v} onChange={(e) => set(e.target.value === '' ? 0 : Number(e.target.value))} />; break;
    case 'url': input = <input type="url" id={id} value={v} placeholder="https://" onChange={(e) => set(e.target.value)} />; break;
    case 'image':
      input = (
        <div className="img-field">
          {v && <img src={mediaUrl(v)} alt="" />}
          {v && <button type="button" className="btn btn-sm btn-ghost" onClick={() => set('')}>Usuń obraz</button>}
          <input type="file" id={id} accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => onFile(e, f.folder || 'img')} disabled={busy} />
          {busy && <span className="small muted">Wgrywanie…</span>}
        </div>
      ); break;
    case 'media': {
      const isFile = v && !/^https?:\/\//i.test(v);
      input = (
        <>
          <input type="text" id={id} value={v} placeholder="https://www.youtube.com/watch?v=…" onChange={(e) => set(e.target.value)} />
          {isFile && <p className="small muted">Wgrany plik: <a href={mediaUrl(v)} target="_blank" rel="noreferrer">{v.split('/').pop()}</a></p>}
          <label className="small file-alt">lub wgraj plik (MP3, MP4, PDF): <input type="file" accept="audio/*,video/mp4,application/pdf" onChange={(e) => onFile(e, f.folder || 'media')} disabled={busy} /></label>
          {busy && <span className="small muted">Wgrywanie…</span>}
        </>
      ); break;
    }
    default: input = <input type="text" id={id} value={v} onChange={(e) => set(e.target.value)} />;
  }
  return (
    <div className="fld">
      <label htmlFor={id}>{f.label}{f.required && <i> *</i>}</label>
      {input}
      {f.help && f.kind !== 'textarea' && <p className="help">{f.help}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ QR panel */

function QrPanel({ row, base, hits }) {
  const full = `${base.replace(/\/$/, '')}/qr/${encodeURIComponent(row.code)}`;
  const { svg, qr, n, size } = useMemo(() => {
    const qr = qrcode(0, 'Q'); qr.addData(full); qr.make();
    const n = qr.getModuleCount(), m = 4, size = n + m * 2;
    let d = '';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c + m} ${r + m}h1v1h-1z`;
    return { qr, n, size, svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" shape-rendering="crispEdges"><rect width="${size}" height="${size}" fill="#fff"/><path fill="#15161c" d="${d}"/></svg>` };
  }, [full]);
  const dl = (href, ext) => { const a = document.createElement('a'); a.href = href; a.download = `qr-${row.code}.${ext}`; document.body.appendChild(a); a.click(); a.remove(); };
  const png = () => {
    const px = 1600, cv = document.createElement('canvas'); cv.width = cv.height = px;
    const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, px, px); ctx.fillStyle = '#15161c';
    const cell = px / size;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect(Math.floor((c + 4) * cell), Math.floor((r + 4) * cell), Math.ceil(cell), Math.ceil(cell));
    dl(cv.toDataURL('image/png'), 'png');
  };
  return (
    <aside className="qr-side card">
      <h2>Kod do druku</h2>
      <div className="qr-box" dangerouslySetInnerHTML={{ __html: svg }} />
      <p className="qr-url">{full}</p>
      <div className="btns">
        <button type="button" className="btn btn-sm" onClick={() => dl(URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' })), 'svg')}>⬇ SVG (do druku)</button>
        <button type="button" className="btn btn-sm btn-ghost" onClick={png}>⬇ PNG</button>
      </div>
      <p className="help">Do drukarni wysyłaj <b>SVG</b> — jest ostry w każdym rozmiarze. Minimalny rozmiar w książce: ok. 2 × 2 cm.</p>
      <hr />
      <p className="big-num">{row.scans || 0}</p>
      <p className="muted center">skanów łącznie{row.last_scan && <><br />ostatni: {new Date(row.last_scan).toLocaleString('pl-PL')}</>}</p>
      {hits.length > 0 && <table className="tbl small"><tbody>{hits.map((h) => <tr key={h.day}><td>{h.day}</td><td className="r">{h.n}</td></tr>)}</tbody></table>}
    </aside>
  );
}

/* ------------------------------------------------------------------ screens */

function EntityList({ ent, toast }) {
  const def = ENTITIES[ent];
  const [rows, setRows] = useState(null);
  const [books, setBooks] = useState({});
  const [base, setBase] = useState('');
  useEffect(() => {
    let qy = sb().from(ent).select('*');
    def.order.forEach(([c, asc]) => { qy = qy.order(c, { ascending: asc, nullsFirst: false }); });
    qy.then(({ data, error }) => { if (error) toast(error.message, 'err'); setRows(data || []); });
    sb().from('books').select('id,title_pl').then(({ data }) => setBooks(Object.fromEntries((data || []).map((b) => [b.id, b.title_pl]))));
    if (ent === 'qr') sb().from('settings').select('value').eq('key', 'qr_base').maybeSingle().then(({ data }) => setBase(data?.value || PUB('')));
  }, [ent]); // eslint-disable-line react-hooks/exhaustive-deps

  const cell = (r, k) => {
    const v = r[k];
    if (['cover', 'image', 'logo', 'photo'].includes(k)) return v ? <img className="thumb" src={mediaUrl(v)} alt="" /> : <span className="thumb thumb-0" />;
    if (k === 'published') return v ? <span className="ok">● tak</span> : <span className="no">○ ukryte</span>;
    if (k === 'category') return { show: 'Przedstawienie', meeting: 'Spotkanie', other: 'Inne' }[v] || v;
    if (k === 'starts_at' || k === 'date') return v ? fmtDate(v, 'pl') : '—';
    if (k === 'book_id') return books[v] || '—';
    if (k === 'scans') return <b>{v || 0}</b>;
    if (['title_pl', 'name', 'code'].includes(k)) return <Link className="strong" href={A(`${ent}/${r.id}`)}>{v || r.title_fr || '(bez tytułu)'}</Link>;
    return v;
  };
  return (
    <>
      <header className="ph ph-row"><div><h1>{def.icon} {def.label}</h1><p className="muted">{rows ? `${rows.length} pozycji` : 'Wczytywanie…'}</p></div>
        <Link className="btn btn-red" href={A(`${ent}/new`)}>+ Dodaj {def.one}</Link></header>
      {ent === 'qr' && <div className="callout callout-blue">Każdy kod prowadzi pod adres <b>{base}/qr/<i>kod</i></b>. Ten adres jest drukowany w książce i działa zawsze — treść pod nim możesz zmieniać kiedy chcesz.</div>}
      {rows && !rows.length && <div className="empty-a">Jeszcze nic tu nie ma. <Link href={A(`${ent}/new`)}>Dodaj pierwszą pozycję →</Link></div>}
      {rows?.length > 0 && (
        <div className="tbl-wrap"><table className="tbl tbl-list">
          <thead><tr>{def.list.map(([k, l]) => <th key={k}>{l}</th>)}<th></th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}>
              {def.list.map(([k, l]) => <td key={k} data-l={l}>{cell(r, k)}</td>)}
              <td className="r nowrap"><Link className="btn btn-sm" href={A(`${ent}/${r.id}`)}>Edytuj</Link> <a className="btn btn-sm btn-ghost" href={PUB(def.publicUrl(r))} target="_blank" rel="noreferrer" title="Zobacz na stronie">↗</a></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </>
  );
}

function EntityForm({ ent, id, toast }) {
  const def = ENTITIES[ent];
  const router = useRouter();
  const isNew = id === 'new';
  const [row, setRow] = useState(isNew ? { ...def.defaults } : null);
  const [books, setBooks] = useState([]);
  const [partners, setPartners] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [qrBase, setQrBase] = useState('');
  const [hits, setHits] = useState([]);
  useDirtyGuard(dirty);

  useEffect(() => {
    if (!isNew) sb().from(ent).select('*').eq('id', id).maybeSingle().then(({ data }) => { if (!data) { toast('Nie znaleziono wpisu.', 'err'); router.push(A(ent)); } else setRow(data); });
    if (flatFields(def).some((f) => f.kind === 'partners')) sb().from('partners').select('id,name,published').order('sort').order('name').then(({ data }) => setPartners(data || []));
    if (ent === 'qr') {
      sb().from('books').select('id,title_pl').order('sort').then(({ data }) => setBooks(data || []));
      sb().from('settings').select('value').eq('key', 'qr_base').maybeSingle().then(({ data }) => setQrBase(data?.value || PUB('')));
    }
  }, [ent, id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (ent === 'qr' && row?.code && !isNew) sb().from('qr_hits').select('day,n').eq('code', row.code).order('day', { ascending: false }).limit(14).then(({ data }) => setHits(data || []));
  }, [ent, row?.code, isNew]);

  if (!row) return <p className="muted">Wczytywanie…</p>;
  const set = (name) => (val) => { setRow((r) => ({ ...r, [name]: val })); setDirty(true); };

  const save = async (e) => {
    e.preventDefault();
    const fields = flatFields(def);
    const data = {};
    for (const f of fields) {
      let v = row[f.name];
      if (f.kind === 'slug' || f.kind === 'code') v = slugify(v || row[f.from] || row.title_fr || row.name || '');
      if (f.kind === 'url' && v && !/^https?:\/\//i.test(v)) v = 'https://' + v.trim();
      if (typeof v === 'string' && !['textarea'].includes(f.kind)) v = v.trim();
      if (['date', 'datetime'].includes(f.kind) && !v) v = null;
      if (f.kind === 'partners') { data[f.name] = Array.isArray(v) ? v.map(Number) : []; continue; }
      data[f.name] = v ?? (f.kind === 'checkbox' ? false : ['number'].includes(f.kind) ? 0 : ['book', 'date', 'datetime'].includes(f.kind) ? null : '');
    }
    for (const f of def.fields.filter((x) => x.required)) {
      const ok = f.pair ? (data[`${f.name}_pl`] || data[`${f.name}_fr`]) : data[f.name];
      if (!ok) return toast(`Uzupełnij pole: ${f.label}.`, 'err');
    }
    for (const k of ['slug', 'code']) if (k in data) {
      const baseVal = data[k]; let i = 2;
      // keep slugs/codes unique
      for (;;) {
        let qy = sb().from(ent).select('id').eq(k, data[k]);
        if (!isNew) qy = qy.neq('id', row.id);
        const { data: hit } = await qy.limit(1);
        if (!hit?.length) break;
        data[k] = `${baseVal}-${i++}`;
      }
    }
    setSaving(true);
    const res = isNew ? await sb().from(ent).insert(data).select().single() : await sb().from(ent).update(data).eq('id', row.id).select().single();
    setSaving(false);
    if (res.error) return toast(res.error.message, 'err');
    setDirty(false); setRow(res.data);
    toast('Zapisano ✔');
    refreshSite();
    if (isNew) router.replace(A(`${ent}/${res.data.id}`));
  };
  const del = async () => {
    if (!confirm('Na pewno usunąć? Tego nie da się cofnąć.')) return;
    const { error } = await sb().from(ent).delete().eq('id', row.id);
    if (error) return toast(error.message, 'err');
    setDirty(false); toast('Usunięto.'); refreshSite(); router.push(A(ent));
  };

  const render = (f, i) => {
    if (f.row) return <div className="row" key={i}>{f.row.map((c) => <Field key={c.name} f={c} value={row[c.name]} set={set(c.name)} books={books} partners={partners} onPartnerCreated={(p) => setPartners((l) => [...l, p])} err={(m) => toast(m, 'err')} />)}</div>;
    if (f.pair) return (
      <div className="pair" key={i}>
        <div className="pair-col"><span className="flag">PL</span><Field f={{ ...f, help: undefined, name: `${f.name}_pl`, label: `${f.label} — po polsku` }} value={row[`${f.name}_pl`]} set={set(`${f.name}_pl`)} books={books} partners={partners} onPartnerCreated={(p) => setPartners((l) => [...l, p])} err={(m) => toast(m, 'err')} /></div>
        <div className="pair-col"><span className="flag flag-fr">FR</span><Field f={{ ...f, help: undefined, name: `${f.name}_fr`, label: `${f.label} — en français`, required: false }} value={row[`${f.name}_fr`]} set={set(`${f.name}_fr`)} books={books} partners={partners} onPartnerCreated={(p) => setPartners((l) => [...l, p])} err={(m) => toast(m, 'err')} /></div>
        {f.help && <p className="help pair-help">{f.help}</p>}
      </div>
    );
    return <Field key={i} f={f} value={row[f.name]} set={set(f.name)} books={books} partners={partners} onPartnerCreated={(p) => setPartners((l) => [...l, p])} err={(m) => toast(m, 'err')} />;
  };
  const title = isNew ? `Nowy: ${def.one}` : (row.title_pl || row.name || row.code || 'Edycja');
  return (
    <>
      <header className="ph ph-row"><div><p className="crumb"><Link href={A(ent)}>← {def.label}</Link></p><h1>{title}</h1></div>
        {!isNew && <a className="btn btn-ghost" href={PUB(def.publicUrl(row))} target="_blank" rel="noreferrer">Zobacz na stronie ↗</a>}</header>
      <form className="form" onSubmit={save}>
        <div className="form-grid">
          <div className="form-main">{def.fields.map(render)}</div>
          {ent === 'qr' && !isNew && row.code && <QrPanel row={row} base={qrBase} hits={hits} />}
        </div>
        <div className="savebar">
          <button className="btn btn-red" type="submit" disabled={saving}>{saving ? 'Zapisywanie…' : '💾 Zapisz'}</button>
          <Link className="btn btn-ghost" href={A(ent)}>Anuluj</Link>
          {!isNew && <button className="btn btn-danger" type="button" onClick={del}>Usuń</button>}
        </div>
      </form>
    </>
  );
}

function PagesScreen({ pkey, toast }) {
  const [p, setP] = useState(null);
  const [dirty, setDirty] = useState(false);
  useDirtyGuard(dirty);
  useEffect(() => {
    if (pkey) sb().from('pages').select('*').eq('key', pkey).maybeSingle().then(({ data }) => setP(data || { key: pkey, title_pl: '', title_fr: '', body_pl: '', body_fr: '', image: '' }));
  }, [pkey]);
  if (!pkey || !PAGES[pkey]) return (
    <>
      <header className="ph"><h1>📄 Strony stałe</h1><p className="muted">Teksty stron, które zawsze są w menu.</p></header>
      <div className="tiles">{Object.entries(PAGES).map(([k, [l]]) => <Link key={k} className="tile" href={A(`pages/${k}`)}><b>{l}</b><span>Edytuj →</span></Link>)}</div>
    </>
  );
  if (!p) return <p className="muted">Wczytywanie…</p>;
  const [label, pub, note] = PAGES[pkey];
  const set = (k) => (v) => { setP((x) => ({ ...x, [k]: v })); setDirty(true); };
  const save = async (e) => {
    e.preventDefault();
    const { error } = await sb().from('pages').upsert({ key: pkey, title_pl: p.title_pl, title_fr: p.title_fr, body_pl: p.body_pl, body_fr: p.body_fr, image: p.image || '' });
    if (error) return toast(error.message, 'err');
    setDirty(false); toast('Zapisano ✔'); refreshSite();
  };
  const err = (m) => toast(m, 'err');
  return (
    <>
      <header className="ph ph-row"><div><p className="crumb"><Link href={A('pages')}>← Strony stałe</Link></p><h1>{label}</h1></div>
        <a className="btn btn-ghost" href={PUB(pub)} target="_blank" rel="noreferrer">Zobacz na stronie ↗</a></header>
      {note && <div className="callout callout-blue">{note}</div>}
      <form className="form" onSubmit={save}>
        <div className="pair"><div className="pair-col"><span className="flag">PL</span><Field f={{ name: 'title_pl', label: 'Tytuł — po polsku', kind: 'text' }} value={p.title_pl} set={set('title_pl')} err={err} /></div>
          <div className="pair-col"><span className="flag flag-fr">FR</span><Field f={{ name: 'title_fr', label: 'Titre — en français', kind: 'text' }} value={p.title_fr} set={set('title_fr')} err={err} /></div></div>
        <div className="pair"><div className="pair-col"><span className="flag">PL</span><Field f={{ name: 'body_pl', label: 'Treść — po polsku', kind: 'textarea' }} value={p.body_pl} set={set('body_pl')} err={err} /></div>
          <div className="pair-col"><span className="flag flag-fr">FR</span><Field f={{ name: 'body_fr', label: 'Contenu — en français', kind: 'textarea' }} value={p.body_fr} set={set('body_fr')} err={err} /></div>
          <p className="help pair-help">{MD_HELP}</p></div>
        {pkey !== 'home' && <Field f={{ name: 'image', label: 'Zdjęcie (opcjonalnie)', kind: 'image', folder: 'pages' }} value={p.image} set={set('image')} err={err} />}
        <div className="savebar"><button className="btn btn-red">💾 Zapisz</button></div>
      </form>
    </>
  );
}

function SettingsScreen({ toast }) {
  const [s, setS] = useState(null);
  const [dirty, setDirty] = useState(false);
  useDirtyGuard(dirty);
  useEffect(() => { sb().from('settings').select('key,value').then(({ data }) => setS(Object.fromEntries((data || []).map((r) => [r.key, r.value])))); }, []);
  if (!s) return <p className="muted">Wczytywanie…</p>;
  const save = async (e) => {
    e.preventDefault();
    const rows = Object.values(SETTINGS).flatMap((g) => Object.keys(g)).map((k) => {
      let v = String(s[k] ?? '').trim();
      if (['facebook', 'linkedin', 'instagram', 'youtube', 'qr_base'].includes(k) && v && !/^https?:\/\//i.test(v)) v = 'https://' + v;
      if (k === 'qr_base') v = v.replace(/\/+$/, '');
      return { key: k, value: v };
    });
    const { error } = await sb().from('settings').upsert(rows);
    if (error) return toast(error.message, 'err');
    setDirty(false); toast('Zapisano ✔'); refreshSite();
  };
  return (
    <>
      <header className="ph"><h1>⚙️ Dane Fundacji</h1><p className="muted">Puste pola są ukryte na stronie.</p></header>
      <form className="form" onSubmit={save}>
        {Object.entries(SETTINGS).map(([g, fields]) => (
          <fieldset className="card" key={g}><legend>{g}</legend><div className="row row-2">
            {Object.entries(fields).map(([k, l]) => (
              <div className="fld" key={k}><label htmlFor={`s_${k}`}>{l}</label>
                {k.startsWith('seo_') ? <textarea id={`s_${k}`} rows={3} value={s[k] || ''} onChange={(e) => { setS({ ...s, [k]: e.target.value }); setDirty(true); }} />
                  : <input id={`s_${k}`} type="text" value={s[k] || ''} onChange={(e) => { setS({ ...s, [k]: e.target.value }); setDirty(true); }} />}
                {k === 'qr_base' && <p className="help">Ustaw raz, przed drukiem: <code>https://fundacja-ed.com</code> (adres strony publicznej, nie panelu). Ten adres trafia do kodów QR w książkach.</p>}
              </div>
            ))}
          </div></fieldset>
        ))}
        <div className="savebar"><button className="btn btn-red">💾 Zapisz</button></div>
      </form>
    </>
  );
}

function MessagesScreen({ mid, toast, onRead }) {
  const router = useRouter();
  const [list, setList] = useState(null);
  const [m, setM] = useState(null);
  useEffect(() => {
    if (mid) sb().from('messages').select('*').eq('id', mid).maybeSingle().then(async ({ data }) => {
      setM(data);
      if (data && !data.is_read) { await sb().from('messages').update({ is_read: true }).eq('id', data.id); onRead(); }
    });
    else sb().from('messages').select('*').order('id', { ascending: false }).limit(500).then(({ data }) => setList(data || []));
  }, [mid]); // eslint-disable-line react-hooks/exhaustive-deps
  if (mid) {
    if (!m) return <p className="muted">Wczytywanie…</p>;
    const del = async () => { if (!confirm('Usunąć tę wiadomość?')) return; await sb().from('messages').delete().eq('id', m.id); toast('Usunięto wiadomość.'); router.push(A('messages')); };
    return (
      <>
        <header className="ph"><p className="crumb"><Link href={A('messages')}>← Wiadomości</Link></p><h1>{m.name}</h1>
          <p className="muted">{new Date(m.created_at).toLocaleString('pl-PL')} · {String(m.lang).toUpperCase()} · <a href={`mailto:${m.email}`}>{m.email}</a></p></header>
        <div className="card msg" style={{ whiteSpace: 'pre-wrap' }}>{m.body}</div>
        <div className="savebar"><a className="btn btn-red" href={`mailto:${m.email}?subject=${encodeURIComponent('Re: Fundacja Elisabeth Duda')}`}>↩ Odpowiedz</a><button className="btn btn-danger" onClick={del}>Usuń</button></div>
      </>
    );
  }
  return (
    <>
      <header className="ph"><h1>✉️ Wiadomości</h1><p className="muted">Z formularza „Napisz do nas”.</p></header>
      {list && !list.length && <div className="empty-a">Brak wiadomości.</div>}
      {list?.length > 0 && <ul className="list card">{list.map((x) => (
        <li key={x.id} className={x.is_read ? '' : 'unread'}><Link href={A(`messages/${x.id}`)}><b>{x.name}</b> <span className="muted">{x.email} · {new Date(x.created_at).toLocaleString('pl-PL')}</span><br />{excerpt(x.body, 140)}</Link></li>
      ))}</ul>}
    </>
  );
}

function UsersScreen({ me, toast }) {
  const [accounts, setAccounts] = useState([]);
  const [pw, setPw] = useState('');
  const load = useCallback(() => sb().rpc('list_accounts').then(({ data }) => setAccounts(data || [])), []);
  useEffect(() => { load(); }, [load]);
  const changePw = async (e) => {
    e.preventDefault();
    if (pw.length < 10) return toast('Hasło musi mieć co najmniej 10 znaków.', 'err');
    const { error } = await sb().auth.updateUser({ password: pw });
    if (error) return toast(error.message, 'err');
    setPw(''); toast('Hasło zmienione ✔');
  };
  const approve = async (a) => { const { error } = await sb().from('admins').insert({ user_id: a.user_id, name: a.name || '' }); if (error) toast(error.message, 'err'); else { toast('Dostęp nadany ✔'); load(); } };
  const revoke = async (a) => { if (!confirm(`Odebrać dostęp: ${a.email}?`)) return; const { error } = await sb().from('admins').delete().eq('user_id', a.user_id); if (error) toast(error.message, 'err'); else { toast('Dostęp odebrany.'); load(); } };
  return (
    <>
      <header className="ph"><h1>👤 Konta i hasło</h1></header>
      <div className="cols">
        <section className="card"><h2>Zmień swoje hasło</h2>
          <form className="form" onSubmit={changePw}>
            <div className="fld"><label htmlFor="npw">Nowe hasło (min. 10 znaków)</label><input id="npw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" /></div>
            <button className="btn btn-red">Zmień hasło</button>
          </form></section>
        <section className="card"><h2>Osoby z dostępem</h2>
          <table className="tbl"><tbody>{accounts.map((a) => (
            <tr key={a.user_id}><td><b>{a.name || '—'}</b><br /><span className="muted">{a.email}</span></td>
              <td className="r">{a.user_id === me ? <span className="muted">to Ty</span> : a.is_admin ? <button className="btn btn-sm btn-danger" onClick={() => revoke(a)}>Odbierz dostęp</button> : <button className="btn btn-sm btn-red" onClick={() => approve(a)}>Nadaj dostęp</button>}</td></tr>
          ))}</tbody></table>
          <h3>Jak dodać osobę?</h3>
          <p className="small">Nowe konto zakłada opiekun techniczny strony (tapFunnel). Gdy konto zostanie utworzone, pojawi się tutaj — kliknij <b>Nadaj dostęp</b>.</p>
        </section>
      </div>
    </>
  );
}

function Dashboard({ name }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    (async () => {
      const c = async (t) => (await sb().from(t).select('*', { count: 'exact', head: true })).count || 0;
      const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
      const [books, events, news, qr, msgs, top, hits, settings] = await Promise.all([
        c('books'), c('events'), c('news'), c('qr'),
        sb().from('messages').select('*').order('id', { ascending: false }).limit(5),
        sb().from('qr').select('id,code,scans,book_id,books(title_pl)').order('scans', { ascending: false }).limit(6),
        sb().from('qr_hits').select('n').gte('day', since),
        sb().from('settings').select('key,value'),
      ]);
      const s = Object.fromEntries((settings.data || []).map((r) => [r.key, r.value]));
      const missing = [['email', 'e-mail kontaktowy'], ['krs', 'numer KRS'], ['bank_account', 'numer konta'], ['linkedin', 'link do LinkedIn']].filter(([k]) => !s[k]).map(([, l]) => l);
      setD({ books, events, news, qr, msgs: msgs.data || [], top: top.data || [], week: (hits.data || []).reduce((a, h) => a + h.n, 0), missing });
    })();
  }, []);
  return (
    <>
      <header className="ph"><h1>Dzień dobry{name ? `, ${name}` : ''}!</h1><p className="muted">Co chcesz dziś zrobić?</p></header>
      {d?.missing.length > 0 && <div className="callout">⚠️ Uzupełnij w <Link href={A('settings')}>Danych Fundacji</Link>: <b>{d.missing.join(', ')}</b>. Bez nich te elementy są ukryte na stronie.</div>}
      <div className="quick">
        <Link href={A('news/new')}><span>📰</span>Dodaj aktualność</Link>
        <Link href={A('events/new')}><span>🎭</span>Dodaj wydarzenie</Link>
        <Link href={A('qr/new')}><span>▣</span>Dodaj kod QR</Link>
        <Link href={A('books/new')}><span>📚</span>Dodaj książkę</Link>
      </div>
      {d && <>
        <div className="stats">
          <div><b>{d.books}</b>książki</div><div><b>{d.events}</b>wydarzenia</div><div><b>{d.news}</b>aktualności</div><div><b>{d.qr}</b>kody QR</div>
          <div className="hl"><b>{d.week}</b>skany QR (7 dni)</div>
        </div>
        <div className="cols">
          <section className="card"><h2>Ostatnie wiadomości</h2>
            {!d.msgs.length ? <p className="muted">Brak wiadomości.</p> : <ul className="list">{d.msgs.map((m) => (
              <li key={m.id} className={m.is_read ? '' : 'unread'}><Link href={A(`messages/${m.id}`)}><b>{m.name}</b> <span className="muted">{new Date(m.created_at).toLocaleDateString('pl-PL')}</span><br />{excerpt(m.body, 90)}</Link></li>
            ))}</ul>}
          </section>
          <section className="card"><h2>Kody QR — najczęściej skanowane</h2>
            {!d.top.length ? <p className="muted">Brak kodów.</p> : <table className="tbl"><thead><tr><th>Kod</th><th>Książka</th><th className="r">Skany</th></tr></thead><tbody>
              {d.top.map((r) => <tr key={r.id}><td><Link href={A(`qr/${r.id}`)}>{r.code}</Link></td><td>{r.books?.title_pl || '—'}</td><td className="r"><b>{r.scans}</b></td></tr>)}
            </tbody></table>}
          </section>
        </div>
      </>}
    </>
  );
}

function Help() {
  return (
    <>
      <header className="ph"><h1>❓ Pomoc</h1></header>
      <div className="card prose-a">
        <h2>Jak dodać aktualność?</h2><p>Menu <b>Aktualności → + Dodaj wpis</b>. Wpisz tytuł i treść po polsku i po francusku, dodaj zdjęcie, kliknij <b>Zapisz</b>. Wpis pojawia się na stronie od razu.</p>
        <h2>Jak ukryć coś bez usuwania?</h2><p>Odznacz <b>Widoczny na stronie</b> i zapisz.</p>
        <h2>Wersja francuska</h2><p>Każde pole ma wersję PL i FR. Jeśli zostawisz FR puste, francuska strona pokaże tekst polski.</p>
        <h2>Kody QR w książce</h2>
        <ol>
          <li><b>Kody QR → + Dodaj kod QR</b>. Wpisz krótki kod (np. <code>mania-01</code>), wybierz książkę, tytuł, wklej link do nagrania lub wgraj plik.</li>
          <li>Po zapisaniu po prawej pojawi się gotowy kod — pobierz <b>SVG</b> i przekaż do składu książki.</li>
          <li>Przed drukiem sprawdź telefonem każdy kod na wydruku próbnym.</li>
          <li>Po druku <b>nie zmieniaj kodu</b>. Treść, nagranie i zdjęcie możesz zmieniać kiedy chcesz.</li>
        </ol>
        <h2>Formatowanie tekstu</h2><p>Użyj przycisków nad polem tekstowym albo wpisz: <code>**pogrubienie**</code>, <code>*kursywa*</code>, <code>## Nagłówek</code>, <code>- punkt listy</code>, <code>[tekst](https://adres)</code>. Pusta linia zaczyna nowy akapit.</p>
        <h2>Zdjęcia</h2><p>JPG, PNG lub WebP. Duże zdjęcia są automatycznie zmniejszane.</p>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ auth screens */

function AuthBox({ children }) {
  return <div className="is-auth"><main className="main"><div className="auth"><img src="/assets/img/logo-color.svg" alt="Fundacja Elisabeth Duda" />{children}</div></main></div>;
}

function Login() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ email: '', pass: '', name: '' });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);
  const up = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const submit = async (e) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    const auth = sb().auth;
    const redirect = window.location.origin + A();
    if (mode === 'login') {
      const { error } = await auth.signInWithPassword({ email: f.email.trim(), password: f.pass });
      if (error) setMsg(['err', error.message.includes('Email not confirmed') ? 'Potwierdź najpierw adres e-mail (link w wiadomości od nas).' : 'Nieprawidłowy e-mail lub hasło.']);
    } else if (mode === 'signup') {
      if (f.pass.length < 10) { setBusy(false); return setMsg(['err', 'Hasło musi mieć co najmniej 10 znaków.']); }
      const { data, error } = await auth.signUp({ email: f.email.trim(), password: f.pass, options: { data: { name: f.name.trim() }, emailRedirectTo: redirect } });
      if (error) setMsg(['err', error.message]);
      else if (!data.session) setMsg(['ok', 'Sprawdź skrzynkę i kliknij link potwierdzający. Potem zaloguj się tutaj.']);
    } else {
      const { error } = await auth.resetPasswordForEmail(f.email.trim(), { redirectTo: redirect });
      setMsg(error ? ['err', error.message] : ['ok', 'Jeśli konto istnieje, wysłaliśmy link do ustawienia nowego hasła.']);
    }
    setBusy(false);
  };
  return (
    <AuthBox>
      <h1>{mode === 'login' ? 'Panel Fundacji' : mode === 'signup' ? 'Utwórz konto' : 'Nowe hasło'}</h1>
      {msg && <p className={msg[0] === 'err' ? 'err' : 'flash flash-ok'}>{msg[1]}</p>}
      <form onSubmit={submit}>
        {mode === 'signup' && <label>Imię<input value={f.name} onChange={up('name')} autoComplete="name" /></label>}
        <label>E-mail<input type="email" required value={f.email} onChange={up('email')} autoComplete="username" autoFocus /></label>
        {mode !== 'reset' && <label>Hasło{mode === 'signup' && ' (min. 10 znaków)'}<input type="password" required value={f.pass} onChange={up('pass')} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} /></label>}
        <button className="btn btn-red" disabled={busy}>{busy ? '…' : mode === 'login' ? 'Zaloguj' : mode === 'signup' ? 'Utwórz konto' : 'Wyślij link'}</button>
      </form>
      <p className="muted small auth-links">
        {mode !== 'login' && <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); setMsg(null); }}>← Logowanie</a>}
        {mode === 'login' && <a href="#" onClick={(e) => { e.preventDefault(); setMode('reset'); setMsg(null); }}>Nie pamiętasz hasła?</a>}
      </p>
      <p className="muted small"><a href={PUB()}>← wróć na stronę</a></p>
    </AuthBox>
  );
}

function NewPassword({ done }) {
  const [pw, setPw] = useState(''); const [err, setErr] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (pw.length < 10) return setErr('Hasło musi mieć co najmniej 10 znaków.');
    const { error } = await sb().auth.updateUser({ password: pw });
    if (error) setErr(error.message); else done();
  };
  return (
    <AuthBox><h1>Ustaw nowe hasło</h1>{err && <p className="err">{err}</p>}
      <form onSubmit={submit}><label>Nowe hasło (min. 10 znaków)<input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" autoFocus /></label><button className="btn btn-red">Zapisz hasło</button></form>
    </AuthBox>
  );
}

function NotYet({ email, noAdmins, onClaimed }) {
  const [key, setKey] = useState(''); const [name, setName] = useState(''); const [err, setErr] = useState('');
  const claim = async (e) => {
    e.preventDefault();
    const { data, error } = await sb().rpc('claim_first_admin', { p_key: key.trim(), p_name: name.trim() });
    if (error || !data) setErr('Nieprawidłowy klucz instalacyjny.'); else onClaimed();
  };
  return (
    <AuthBox>
      {noAdmins ? (
        <><h1>Pierwsze uruchomienie</h1><p>Zalogowano jako <b>{email}</b>. Wpisz klucz instalacyjny, aby zostać administratorem.</p>
          {err && <p className="err">{err}</p>}
          <form onSubmit={claim}><label>Imię<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>Klucz instalacyjny<input value={key} onChange={(e) => setKey(e.target.value)} required autoComplete="off" /></label><button className="btn btn-red">Aktywuj panel</button></form></>
      ) : (
        <><h1>Konto czeka na dostęp</h1><p>Zalogowano jako <b>{email}</b>. Administrator Fundacji musi nadać Ci dostęp w panelu (<i>Konta i hasło</i>).</p></>
      )}
      <p className="muted small"><a href="#" onClick={async (e) => { e.preventDefault(); await sb().auth.signOut(); }}>Wyloguj</a></p>
    </AuthBox>
  );
}

/* ------------------------------------------------------------------ app */

export default function AdminApp({ path }) {
  const [session, setSession] = useState(undefined);
  const [admin, setAdmin] = useState(null); // null = checking
  const [noAdmins, setNoAdmins] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [unread, setUnread] = useState(0);
  const [navOpen, setNavOpen] = useState(false);
  const [name, setName] = useState('');
  const toast = useCallback((m, type = 'ok') => { setToastMsg([type, m]); setTimeout(() => setToastMsg(null), type === 'err' ? 6000 : 2500); }, []);

  useEffect(() => {
    sb().auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = sb().auth.onAuthStateChange((ev, s) => { setSession(s); if (ev === 'PASSWORD_RECOVERY') setRecovery(true); });
    return () => sub.subscription.unsubscribe();
  }, []);
  const check = useCallback(async () => {
    if (!session) { setAdmin(null); return; }
    const [{ data: isA }, { data: exists }] = await Promise.all([sb().rpc('is_admin'), sb().rpc('admins_exist')]);
    setAdmin(!!isA); setNoAdmins(!exists);
    if (isA) {
      const [{ count }, { data: me }] = await Promise.all([
        sb().from('messages').select('*', { count: 'exact', head: true }).eq('is_read', false),
        sb().from('admins').select('name').eq('user_id', session.user.id).maybeSingle(),
      ]);
      setUnread(count || 0); setName(me?.name || '');
    }
  }, [session]);
  useEffect(() => { check(); }, [check]);
  useEffect(() => { setNavOpen(false); }, [path]);

  if (session === undefined) return <p style={{ padding: 40 }}>Wczytywanie…</p>;
  if (recovery && session) return <NewPassword done={() => { setRecovery(false); toast('Hasło zmienione ✔'); }} />;
  if (!session) return <Login />;
  if (admin === null) return <p style={{ padding: 40 }}>Wczytywanie…</p>;
  if (!admin) return <NotYet email={session.user.email} noAdmins={noAdmins} onClaimed={check} />;

  const [a, b] = path;
  let screen;
  if (!a) screen = <Dashboard name={name} />;
  else if (ENTITIES[a]) screen = b ? <EntityForm key={`${a}/${b}`} ent={a} id={b} toast={toast} /> : <EntityList key={a} ent={a} toast={toast} />;
  else if (a === 'pages') screen = <PagesScreen key={b || 'all'} pkey={b} toast={toast} />;
  else if (a === 'settings') screen = <SettingsScreen toast={toast} />;
  else if (a === 'messages') screen = <MessagesScreen key={b || 'all'} mid={b} toast={toast} onRead={() => setUnread((u) => Math.max(0, u - 1))} />;
  else if (a === 'users') screen = <UsersScreen me={session.user.id} toast={toast} />;
  else if (a === 'help') screen = <Help />;
  else screen = <p>Nie ma takiej sekcji.</p>;

  const nav = (key, icon, label, extra = null) => <Link href={A(key)} className={(a || '') === key ? 'on' : ''}><span>{icon}</span>{label}{extra}</Link>;
  return (
    <div className="has-nav">
      <aside className={`side${navOpen ? ' open' : ''}`}>
        <Link className="side-brand" href={A()}><img src="/assets/img/pen.svg" alt="" /><span>Panel<br /><small>Fundacja Elisabeth Duda</small></span></Link>
        <button className="side-toggle" type="button" aria-expanded={navOpen} onClick={() => setNavOpen(!navOpen)}>☰ Menu</button>
        <nav className="side-nav">
          {nav('', '🏠', 'Start')}
          <p className="side-h">Treści</p>
          {Object.entries(ENTITIES).map(([k, d]) => <span key={k} style={{ display: 'contents' }}>{nav(k, d.icon, d.label)}</span>)}
          {nav('pages', '📄', 'Strony stałe')}
          {nav('messages', '✉️', 'Wiadomości', unread ? <b className="pill">{unread}</b> : null)}
          <p className="side-h">Ustawienia</p>
          {nav('settings', '⚙️', 'Dane Fundacji')}
          {nav('users', '👤', 'Konta i hasło')}
          {nav('help', '❓', 'Pomoc')}
        </nav>
        <div className="side-foot">
          <a className="btn btn-sm" href={PUB()} target="_blank" rel="noreferrer">Zobacz stronę ↗</a>
          <p>{name || session.user.email} · <a href="#" onClick={async (e) => { e.preventDefault(); await sb().auth.signOut(); }}>Wyloguj</a></p>
        </div>
      </aside>
      <main className="main">
        {toastMsg && <div className={`flash flash-${toastMsg[0]}`} role="status">{toastMsg[1]}</div>}
        {screen}
      </main>
    </div>
  );
}
