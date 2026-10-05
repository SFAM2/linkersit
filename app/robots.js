import { siteUrl } from '../lib/pages';
export default function robots() {
  return { rules: { userAgent: '*', allow: '/', disallow: '/api/' }, sitemap: `${siteUrl}/sitemap.xml` };
}
