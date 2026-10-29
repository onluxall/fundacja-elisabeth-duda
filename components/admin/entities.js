// Content types edited in the panel. Each screen (list + form) is generated from these definitions.
// Field kinds: text, textarea (markdown), url, date, datetime, number, checkbox, select, image, media, book, partners, slug, code
// pair: true → the field exists in PL and FR (name_pl / name_fr), shown side by side.

export const MD_HELP = 'Formatowanie: **pogrubienie**, *kursywa*, ## Nagłówek, - lista, [tekst linku](https://…), > cytat. Pusta linia = nowy akapit.';

export const ENTITIES = {
  books: {
    label: 'Książki', one: 'książkę', icon: '📚',
    order: [['featured', false], ['sort', true], ['id', false]],
    list: [['cover', ''], ['title_pl', 'Tytuł'], ['author', 'Autor'], ['published', 'Widoczna']],
    publicUrl: (r) => `/ksiazki/${r.slug}`,
    defaults: { published: true, sort: 0, featured: false },
    fields: [
      { name: 'title', label: 'Tytuł', kind: 'text', pair: true, required: true },
      { name: 'subtitle', label: 'Podtytuł', kind: 'text', pair: true },
      { name: 'slug', label: 'Adres (slug)', kind: 'slug', from: 'title_pl', help: 'Część adresu, np. /ksiazki/mania-listy-ze-szczuk. Zostaw puste — utworzy się z tytułu.' },
      { row: [{ name: 'author', label: 'Autor', kind: 'text' }, { name: 'translator', label: 'Tłumaczenie', kind: 'text' }, { name: 'publisher', label: 'Wydawca', kind: 'text' }] },
      { row: [{ name: 'year', label: 'Rok wydania', kind: 'text' }, { name: 'isbn', label: 'ISBN (PL)', kind: 'text', help: 'Kilka numerów oddziel średnikiem ;' }, { name: 'isbn_fr', label: 'ISBN (FR)', kind: 'text', help: 'Wydanie francuskie. Puste = strona FR pokaże ISBN PL.' }] },
      { name: 'badge', label: 'Naklejka na okładce', kind: 'text', pair: true, help: 'np. „Wkrótce”, „Nowość” — zostaw puste, aby ukryć.' },
      { name: 'body', label: 'Opis', kind: 'textarea', pair: true, help: MD_HELP },
      { name: 'cover', label: 'Okładka (PL)', kind: 'image', folder: 'covers', help: 'JPG/PNG/WebP, najlepiej pionowa 3:4 lub 2:3. Bez okładki wyświetla się graficzny plakat z tytułem.' },
      { name: 'cover_fr', label: 'Okładka (FR)', kind: 'image', folder: 'covers', help: 'Opcjonalnie: okładka wydania francuskiego. Bez niej na stronie FR pokaże się okładka PL.' },
      { name: 'buy_url', label: 'Link „Kup książkę”', kind: 'url', help: 'Strona wydawcy lub księgarni.' },
      { name: 'partner_ids', label: 'Partnerzy', kind: 'partners', help: 'Zaznacz partnerów tej pozycji — ich logo pokaże się na jej stronie. Nowego partnera dodasz przyciskiem „+ Dodaj nowego partnera”.' },
      { row: [{ name: 'featured', label: 'Wyróżniona na stronie głównej', kind: 'checkbox' }, { name: 'published', label: 'Widoczna na stronie', kind: 'checkbox' }, { name: 'sort', label: 'Kolejność (mniejsza = wyżej)', kind: 'number' }] },
    ],
  },
  events: {
    label: 'Wydarzenia', one: 'wydarzenie', icon: '🎭',
    order: [['starts_at', false], ['id', false]],
    list: [['image', ''], ['title_pl', 'Tytuł'], ['category', 'Rodzaj'], ['starts_at', 'Data'], ['published', 'Widoczne']],
    publicUrl: (r) => `/${r.category === 'show' ? 'przedstawienia' : r.category === 'meeting' ? 'spotkania' : 'wydarzenia'}/${r.slug}`,
    defaults: { published: true, category: 'meeting' },
    fields: [
      { name: 'title', label: 'Tytuł', kind: 'text', pair: true, required: true },
      { name: 'slug', label: 'Adres (slug)', kind: 'slug', from: 'title_pl', help: 'Zostaw puste — utworzy się z tytułu.' },
      { row: [
        { name: 'category', label: 'Rodzaj', kind: 'select', options: { show: 'Przedstawienie / Spectacle', meeting: 'Spotkanie / Rencontre', other: 'Inne wydarzenie' } },
        { name: 'starts_at', label: 'Data i godzina', kind: 'datetime' },
        { name: 'place', label: 'Miejsce', kind: 'text' },
      ] },
      { name: 'body', label: 'Opis', kind: 'textarea', pair: true, help: MD_HELP },
      { name: 'image', label: 'Zdjęcie / plakat', kind: 'image', folder: 'events' },
      { name: 'link', label: 'Link (bilety, wydarzenie na Facebooku…)', kind: 'url' },
      { name: 'partner_ids', label: 'Partnerzy', kind: 'partners', help: 'Zaznacz partnerów tej pozycji — ich logo pokaże się na jej stronie. Nowego partnera dodasz przyciskiem „+ Dodaj nowego partnera”.' },
      { row: [{ name: 'published', label: 'Widoczne na stronie', kind: 'checkbox' }] },
    ],
  },
  news: {
    label: 'Aktualności', one: 'wpis', icon: '📰',
    order: [['date', false], ['id', false]],
    list: [['image', ''], ['title_pl', 'Tytuł'], ['date', 'Data'], ['published', 'Widoczny']],
    publicUrl: (r) => `/aktualnosci/${r.slug}`,
    defaults: { published: true, date: new Date().toISOString().slice(0, 10) },
    fields: [
      { name: 'title', label: 'Tytuł', kind: 'text', pair: true, required: true },
      { name: 'slug', label: 'Adres (slug)', kind: 'slug', from: 'title_pl', help: 'Zostaw puste — utworzy się z tytułu.' },
      { row: [{ name: 'date', label: 'Data', kind: 'date' }, { name: 'published', label: 'Widoczny na stronie', kind: 'checkbox' }] },
      { name: 'body', label: 'Treść', kind: 'textarea', pair: true, help: MD_HELP },
      { name: 'image', label: 'Zdjęcie', kind: 'image', folder: 'news' },
      { name: 'partner_ids', label: 'Partnerzy', kind: 'partners', help: 'Zaznacz partnerów tej pozycji — ich logo pokaże się na jej stronie. Nowego partnera dodasz przyciskiem „+ Dodaj nowego partnera”.' },
    ],
  },
  partners: {
    label: 'Partnerzy', one: 'partnera', icon: '🤝',
    order: [['sort', true], ['name', true]],
    list: [['logo', ''], ['name', 'Nazwa'], ['url', 'Strona'], ['published', 'Widoczny']],
    publicUrl: () => '/ksiazki',
    defaults: { published: true, sort: 0 },
    fields: [
      { name: 'name', label: 'Nazwa', kind: 'text', required: true },
      { name: 'url', label: 'Strona internetowa', kind: 'url' },
      { name: 'logo', label: 'Logo', kind: 'image', folder: 'partners' },
      { name: 'body', label: 'Krótki opis', kind: 'textarea', pair: true, help: MD_HELP },
      { row: [{ name: 'sort', label: 'Kolejność', kind: 'number' }, { name: 'published', label: 'Widoczny na stronie', kind: 'checkbox' }] },
    ],
  },
  team: {
    label: 'Zespół', one: 'osobę', icon: '👤',
    order: [['sort', true], ['id', true]],
    list: [['photo', ''], ['name', 'Imię i nazwisko'], ['role_pl', 'Funkcja'], ['published', 'Widoczna']],
    publicUrl: () => '/o-nas',
    defaults: { published: true, sort: 0 },
    fields: [
      { name: 'name', label: 'Imię i nazwisko', kind: 'text', required: true },
      { name: 'role', label: 'Funkcja', kind: 'text', pair: true, help: 'np. Dyrektor Komunikacji / Directeur de la communication' },
      { name: 'photo', label: 'Zdjęcie', kind: 'image', folder: 'team', help: 'Najlepiej kwadratowe. Bez zdjęcia pokażą się inicjały.' },
      { name: 'email', label: 'E-mail (opcjonalnie)', kind: 'text' },
      { name: 'body', label: 'Krótki opis (opcjonalnie)', kind: 'textarea', pair: true, help: MD_HELP },
      { row: [{ name: 'sort', label: 'Kolejność', kind: 'number' }, { name: 'published', label: 'Widoczna na stronie', kind: 'checkbox' }] },
    ],
  },
  qr: {
    label: 'Kody QR', one: 'kod QR', icon: '▣',
    order: [['book_id', true], ['sort', true], ['id', true]],
    list: [['code', 'Kod'], ['title_pl', 'Tytuł'], ['book_id', 'Książka'], ['scans', 'Skany'], ['published', 'Aktywny']],
    publicUrl: (r) => `/qr/${r.code}?nocount=1`,
    defaults: { published: true, sort: 0 },
    fields: [
      { name: 'code', label: 'Kod (część adresu)', kind: 'code', from: 'title_pl', help: 'Adres drukowany w książce: /qr/kod. Krótko, bez polskich znaków, np. mania-01. Po wydrukowaniu książki NIE zmieniaj kodu!' },
      { name: 'book_id', label: 'Książka', kind: 'book' },
      { name: 'title', label: 'Tytuł materiału', kind: 'text', pair: true, required: true },
      { name: 'media', label: 'Nagranie / film', kind: 'media', pair: true, folder: 'qr', help: 'Link do YouTube lub Vimeo albo wgrany plik MP3 / MP4 / PDF. Wersja FR jest opcjonalna — bez niej pokaże się wersja PL.' },
      { name: 'image', label: 'Zdjęcie', kind: 'image', folder: 'qr' },
      { name: 'body', label: 'Tekst', kind: 'textarea', pair: true, help: MD_HELP },
      { name: 'target_url', label: 'Przekierowanie (opcjonalnie)', kind: 'url', help: 'Jeśli wpiszesz adres, kod od razu przeniesie czytelnika na tę stronę zamiast pokazywać treść powyżej.' },
      { row: [{ name: 'sort', label: 'Kolejność w książce', kind: 'number' }, { name: 'published', label: 'Aktywny', kind: 'checkbox' }] },
    ],
  },
};

/** Flatten definitions → [{ name, kind, ... }] with PL/FR expanded. */
export function flatFields(def) {
  const out = [];
  for (const f of def.fields) {
    if (f.row) out.push(...f.row);
    else if (f.pair) out.push({ ...f, name: `${f.name}_pl` }, { ...f, name: `${f.name}_fr`, required: false });
    else out.push(f);
  }
  return out;
}

export const PAGES = {
  home: ['Strona główna — wstęp', '/', 'Tytuł to duże hasło na stronie głównej: słowa oddzielone przecinkami, środkowe w stylu sprayu.'],
  about: ['O nas / Qui sommes-nous', '/o-nas', ''],
  support: ['Pomóż Fundacji / Soutenir', '/pomoz-fundacji', ''],
  contact: ['Kontakt — tekst nad formularzem', '/kontakt', ''],
};

export const SETTINGS = {
  Fundacja: { site_name: 'Nazwa', tagline: 'Hasło (pod logo)', email: 'E-mail kontaktowy (widoczny na stronie)', phone: 'Telefon', address: 'Adres' },
  'Dane rejestrowe': { krs: 'KRS', nip: 'NIP', regon: 'REGON' },
  Darowizny: { bank_name: 'Nazwa banku', bank_account: 'Numer konta (PL)', iban_swift: 'IBAN / SWIFT (przelewy z zagranicy)' },
  'Media społecznościowe': { facebook: 'Facebook', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' },
  'SEO i kody QR': { seo_desc_pl: 'Opis strony dla Google — PL', seo_desc_fr: 'Opis strony dla Google — FR', qr_base: 'Adres strony w kodach QR' },
};
