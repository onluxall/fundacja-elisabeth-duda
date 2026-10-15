export const metadata = { title: 'Panel · Fundacja Elisabeth Duda', robots: { index: false, follow: false }, icons: { icon: '/assets/img/pen.svg' } };
export default function AdminLayout({ children }) {
  return (
    <html lang="pl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@400;500;600;700&family=Source+Serif+4&display=swap&subset=latin-ext" />
        <link rel="stylesheet" href="/assets/css/admin.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
