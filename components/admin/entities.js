// Content types edited in the panel. Each screen (list + form) is generated from these definitions.
// Field kinds: text, textarea (markdown), url, date, datetime, number, checkbox, select, image, media, book, partners, roles, slug, code
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
    list: [['logo', ''], ['name', 'Nazwa'], ['roles', 'Kategorie i projekty'], ['published', 'Widoczny']],
    publicUrl: () => '/partnerzy',
    defaults: { published: true, sort: 0 },
    fields: [
      { name: 'name', label: 'Nazwa', kind: 'text', required: true },
      { name: 'url', label: 'Strona internetowa', kind: 'url', help: 'Logo na stronie „Nasi Partnerzy” prowadzi pod ten adres.' },
      { name: 'logo', label: 'Logo', kind: 'image', folder: 'partners', help: 'Najlepiej SVG lub PNG na przezroczystym tle. Logo pokazuje się w oryginalnych proporcjach.' },
      { name: 'roles', label: 'Kategorie i projekty', kind: 'roles', help: 'W jakiej kategorii i przy jakim projekcie partner ma się pojawić na stronie „Nasi Partnerzy”. Ten sam partner może mieć kilka wierszy, np. Patronat przy „Mania…” i Partner przy projekcie o Miłoszu.' },
      { name: 'body', label: 'Krótki opis', kind: 'textarea', pair: true, help: MD_HELP },
      { row: [{ name: 'sort', label: 'Kolejność (mniejsza = wyżej)', kind: 'number' }, { name: 'published', label: 'Widoczny na stronie', kind: 'checkbox' }] },
    ],
  },
  projects: {
    label: 'Projekty', one: 'projekt', icon: '🗂️',
    order: [['sort', true], ['id', true]],
    list: [['name_pl', 'Nazwa'], ['book_id', 'Książka'], ['published', 'Widoczny']],
    publicUrl: (r) => `/partnerzy?projekt=${r.slug}`,
    defaults: { published: true, sort: 0 },
    fields: [
      { name: 'name', label: 'Nazwa projektu', kind: 'text', pair: true, required: true, help: 'Nazwa przycisku na stronie „Nasi Partnerzy”, np. „Mania – Listy ze Szczuk”.' },
      { name: 'slug', label: 'Adres (slug)', kind: 'slug', from: 'name_pl', help: 'Zostaw puste — utworzy się z nazwy.' },
      { row: [{ name: 'book_id', label: 'Powiązana książka (opcjonalnie)', kind: 'book' }, { name: 'sort', label: 'Kolejność (mniejsza = wyżej)', kind: 'number' }, { name: 'published', label: 'Widoczny na stronie', kind: 'checkbox' }] },
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
    order: [['book_id', true], ['edition', false], ['sort', true], ['id', true]],
    list: [['code', 'Kod'], ['title_pl', 'Tytuł'], ['book_id', 'Książka'], ['edition', 'Katalog'], ['scans', 'Skany'], ['published', 'Aktywny']],
    publicUrl: (r) => `/qr/${r.code}?nocount=1`,
    defaults: { published: true, sort: 0, edition: 'pl' },
    fields: [
      { name: 'code', label: 'Kod (część adresu)', kind: 'code', from: 'title_pl', help: 'Adres drukowany w książce: /qr/kod. Krótko, bez polskich znaków, np. mania-01. Po wydrukowaniu książki NIE zmieniaj kodu!' },
      { row: [{ name: 'book_id', label: 'Książka', kind: 'book' }, { name: 'edition', label: 'Katalog (wydanie)', kind: 'select', options: { pl: 'Wersja polska', fr: 'Wersja francuska' }, help: 'Kod otwiera się domyślnie w języku wydania. Numeracja kodów liczy się osobno w każdym katalogu.' }] },
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
    if (f.kind === 'roles') continue; // stored in partner_roles, saved separately
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
  partners: ['Nasi Partnerzy / Nos partenaires — wstęp', '/partnerzy', 'Krótki tekst nad listą partnerów (opcjonalnie).'],
};

export const SETTINGS = {
  Fundacja: { site_name: 'Nazwa', tagline: 'Hasło (pod logo)', email: 'E-mail kontaktowy (widoczny na stronie)', phone: 'Telefon', address: 'Adres' },
  'Dane rejestrowe': { krs: 'KRS', nip: 'NIP', regon: 'REGON' },
  'Media społecznościowe': { facebook: 'Facebook', linkedin: 'LinkedIn', instagram: 'Instagram', youtube: 'YouTube' },
  'SEO i kody QR': { seo_desc_pl: 'Opis strony dla Google — PL', seo_desc_fr: 'Opis strony dla Google — FR', qr_base: 'Adres strony w kodach QR' },
};

// Screen „Darowizny” — bank accounts + QR codes for donations (stored in the settings table).
export const DONATION_FIELDS = {
  'Odbiorca': [
    { key: 'don_recipient', label: 'Nazwa odbiorcy (tak jak w banku)', help: 'Trafia do kodu EUR i na stronę.' },
    { key: 'don_qr_name', label: 'Nazwa w kodzie PLN (maks. 20 znaków)', max: 20, help: 'Polski standard kodów QR mieści tylko 20 znaków, np. „Fundacja E. Duda”.' },
    { key: 'bank_name', label: 'Nazwa banku', help: 'np. BNP Paribas' },
    { key: 'don_bic', label: 'SWIFT / BIC', help: 'Wspólny dla obu kont, np. PPABPLPK.' },
  ],
  'Konto PLN': [
    { key: 'bank_account', label: 'Numer konta PLN', help: '26 cyfr, może być z „PL” i spacjami.' },
    { key: 'don_title_pln', label: 'Tytuł przelewu w kodzie PLN (maks. 32 znaki)', max: 32 },
  ],
  'Konto EUR': [
    { key: 'don_eur_iban', label: 'IBAN konta EUR', help: 'np. PL22 1600 …' },
    { key: 'don_title_eur', label: 'Tytuł przelewu w kodzie EUR', max: 140 },
  ],
};

export const PARTNER_CATEGORIES = {
  honorary: 'Patronat honorowy',
  patronage: 'Patronat',
  partner: 'Partnerzy',
  media: 'Partnerzy medialni',
};
