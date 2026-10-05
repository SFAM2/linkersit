const pages = ['about', 'privacy', 'cookies', 'terms', 'legal'];
export default {
  poweredByHeader: false,
  async redirects() {
    return [
      { source: '/index.html', destination: '/', permanent: true },
      ...pages.map(page => ({ source: `/${page}.html`, destination: `/${page}`, permanent: true })),
      { source: '/404.html', destination: '/not-found', permanent: false },
      { source: '/new', destination: '/', permanent: true },
      { source: '/new/:path*', destination: '/:path*', permanent: true },
    ];
  },
  async headers() {
    return [{ source: '/:path*', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    ] }];
  },
};
