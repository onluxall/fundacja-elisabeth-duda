export const LANGS = ['pl', 'fr'];

/** Route key → slug per language. */
export const ROUTES = {
  home:     { pl: '',               fr: '' },
  about:    { pl: 'o-nas',          fr: 'qui-sommes-nous' },
  events:   { pl: 'wydarzenia',     fr: 'evenements' },
  books:    { pl: 'ksiazki',        fr: 'publications' },
  shows:    { pl: 'przedstawienia', fr: 'spectacles' },
  meetings: { pl: 'spotkania',      fr: 'rencontres' },
  partners: { pl: 'partnerzy',      fr: 'partenaires' },
  news:     { pl: 'aktualnosci',    fr: 'actualites' },
  support:  { pl: 'pomoz-fundacji', fr: 'soutenir-la-fondation' },
  contact:  { pl: 'kontakt',        fr: 'contact' },
};

export function url(key, lang = 'pl', slug = null) {
  const p = ROUTES[key]?.[lang] ?? '';
  let u = (lang === 'fr' ? '/fr' : '') + (p ? '/' + p : '') + (slug ? '/' + encodeURIComponent(slug) : '');
  return u || '/';
}

export const eventKey = (cat) => (cat === 'show' ? 'shows' : cat === 'meeting' ? 'meetings' : 'events');

const S = {
  pl: {
    about: 'O nas', events: 'Wydarzenia', books: 'Książki', shows: 'Przedstawienia', meetings: 'Spotkania',
    partners: 'Partnerzy', team: 'Zespół', news: 'Aktualności', support: 'Pomóż Fundacji', contact: 'Napisz do nas',
    menu: 'Menu', buy: 'Kup książkę', read_more: 'Czytaj dalej', all_events: 'Wszystkie wydarzenia',
    all_news: 'Wszystkie aktualności', upcoming: 'Nadchodzące', past: 'Minione', nothing_yet: 'Wkrótce pojawią się tu nowe wpisy.',
    latest_news: 'Z życia Fundacji', our_books: 'Nasze książki', qr_materials: 'Materiały z kodów QR',
    qr_intro: 'Książka zawiera kody QR z nagraniami i filmem. Zeskanuj kod telefonem, aby je otworzyć.', author: 'Autor', translator: 'Tłumaczenie', publisher: 'Wydawca',
    isbn: 'ISBN', year: 'Rok', place: 'Miejsce', date: 'Data', name: 'Imię i nazwisko', email: 'E-mail', message: 'Wiadomość',
    send: 'Wyślij', sending: 'Wysyłanie…', sent: 'Dziękujemy! Wiadomość dotarła do Fundacji.', form_error: 'Uzupełnij imię, poprawny e-mail i treść wiadomości.',
    send_error: 'Nie udało się wysłać. Spróbuj ponownie za chwilę.',
    follow: 'Obserwuj nas', bank: 'Dane do przelewu', account: 'Numer konta', title_transfer: 'Tytuł przelewu',
    transfer_title: 'Darowizna na cele statutowe', krs: 'KRS', bank_label: 'Bank',
    acc_pln: 'Konto w złotych', acc_eur: 'Konto w euro (przelewy z zagranicy)', scan_bank: 'Zeskanuj w aplikacji banku',
    qr_how_h: 'Wpłata kodem QR', qr_how_1: 'Otwórz aplikację swojego banku i wybierz „Skanuj kod QR” (zwykle w Płatnościach lub Przelewach).', qr_how_2: 'Zeskanuj kod przy numerze konta — dane Fundacji i tytuł wpiszą się same.', qr_how_3: 'Wpisz kwotę i zatwierdź przelew.',
    qr_how_note: 'Kod działa w aplikacji banku, nie w zwykłym aparacie. Na telefonie najprościej skopiować numer konta przyciskiem „Kopiuj”.', copy: 'Kopiuj', copied: 'Skopiowano',
    back: 'Wróć', not_found: 'Nie ma takiej strony', not_found_txt: 'Ten adres nie istnieje albo został przeniesiony.',
    go_home: 'Strona główna', from_book: 'Z książki', lang_other: 'Français',
    privacy: 'Twoje dane zostaną użyte wyłącznie do odpowiedzi na wiadomość.', featured: 'Nowa książka',
    skip: 'Przejdź do treści', qr_badge: 'z kodami QR',
  },
  fr: {
    about: 'Qui sommes-nous ?', events: 'Événements', books: 'Publications', shows: 'Spectacles', meetings: 'Rencontres',
    partners: 'Partenaires', team: 'L’équipe', news: 'Actualités', support: 'Soutenir la Fondation', contact: 'Contact',
    menu: 'Menu', buy: 'Acheter le livre', read_more: 'Lire la suite', all_events: 'Tous les événements',
    all_news: 'Toutes les actualités', upcoming: 'À venir', past: 'Passés', nothing_yet: 'De nouveaux contenus arrivent bientôt.',
    latest_news: 'La vie de la Fondation', our_books: 'Nos publications', qr_materials: 'Contenus des codes QR',
    qr_intro: 'Le livre contient des codes QR menant à des enregistrements et à un film. Scannez un code avec votre téléphone pour les découvrir.', author: 'Auteur', translator: 'Traduction', publisher: 'Éditeur',
    isbn: 'ISBN', year: 'Année', place: 'Lieu', date: 'Date', name: 'Nom et prénom', email: 'E-mail', message: 'Message',
    send: 'Envoyer', sending: 'Envoi…', sent: 'Merci ! Votre message a bien été transmis à la Fondation.', form_error: 'Merci d’indiquer votre nom, un e-mail valide et votre message.',
    send_error: 'L’envoi a échoué. Réessayez dans un instant.',
    follow: 'Suivez-nous', bank: 'Coordonnées bancaires', account: 'Numéro de compte', title_transfer: 'Libellé du virement',
    transfer_title: 'Don pour les activités statutaires', krs: 'KRS', bank_label: 'Banque',
    acc_pln: 'Compte en zlotys (PLN)', acc_eur: 'Compte en euros (virement SEPA)', scan_bank: 'Scannez dans votre application bancaire',
    qr_how_h: 'Faire un don par code QR', qr_how_1: 'Ouvrez l’application de votre banque et choisissez « Scanner un QR code » (souvent dans Virements ou Paiements).', qr_how_2: 'Scannez le code à côté du numéro de compte — les coordonnées de la Fondation et le libellé se remplissent automatiquement.', qr_how_3: 'Indiquez le montant et validez le virement.',
    qr_how_note: 'Le code se lit dans l’application bancaire, pas avec l’appareil photo. Sur téléphone, le plus simple est de copier l’IBAN avec le bouton « Copier ». La lecture du code dépend de votre banque.', copy: 'Copier', copied: 'Copié',
    back: 'Retour', not_found: 'Page introuvable', not_found_txt: 'Cette adresse n’existe pas ou a été déplacée.',
    go_home: 'Accueil', from_book: 'Du livre', lang_other: 'Polski',
    privacy: 'Vos données servent uniquement à répondre à votre message.', featured: 'Nouveau livre',
    skip: 'Aller au contenu', qr_badge: 'avec codes QR',
  },
};
export const tFor = (lang) => (k) => S[lang]?.[k] ?? S.pl[k] ?? k;
