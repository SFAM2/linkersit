import SiteScripts from '../components/site-scripts';

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#08090d' };

export default function RootLayout({ children }) {
  return <html lang="en" suppressHydrationWarning><head>
    <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml" />
    <link rel="stylesheet" href="/tokens.css" />
    <link rel="stylesheet" href="/styles.css" />
    <link rel="stylesheet" href="/motion.css" />
    <link rel="stylesheet" href="/pages.css" />
    <noscript><style>{'.sculpture-fallback{opacity:1!important;visibility:visible!important}'}</style></noscript>
  </head><body>{children}<SiteScripts /></body></html>;
}
