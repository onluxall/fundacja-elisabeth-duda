const FONTS = 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Rubik+Spray+Paint&family=Caveat+Brush&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Inter:wght@400;600;800&display=swap&subset=latin-ext';

export default function RootHtml({ lang, children }) {
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={FONTS} />
        <link rel="stylesheet" href="/assets/css/site.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
