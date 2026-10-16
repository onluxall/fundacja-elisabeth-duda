export default function RootHtml({ lang, children }) {
  return (
    <html lang={lang}>
      <head>
        {/* fonts are self-hosted (no requests to Google) */}
        <link rel="preload" href="/assets/fonts/cormorant-garamond-latin-500-normal.woff2" as="font" type="font/woff2" crossOrigin="" />
        <link rel="stylesheet" href="/assets/css/fonts.css" />
        <link rel="stylesheet" href="/assets/css/site.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
