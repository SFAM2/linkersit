import { siteUrl } from '../lib/pages';
export default function sitemap() {
  return ['/', '/about', '/cookies'].map(path => ({ url: `${siteUrl}${path}` }));
}
