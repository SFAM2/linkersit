import { readFile } from 'node:fs/promises';
import path from 'node:path';
import metadata from '../content/metadata.json';

export const pageNames = ['about', 'privacy', 'cookies', 'terms', 'legal'];
export const siteUrl = process.env.SITE_URL || 'https://linkersit.com';
export function pageMetadata(name) {
  const page = metadata[name];
  const url = new URL(name === 'index' ? '/' : `/${name}`, siteUrl).href;
  return {
    title: page.title, description: page.description,
    alternates: { canonical: url },
    robots: page.noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: { title: page.title, description: page.description, url, siteName: 'LinkersIT', locale: 'en_US', type: 'website' },
    twitter: { card: 'summary', title: page.title, description: page.description },
  };
}
export async function pageContent(name) {
  if (!['index', '404', ...pageNames].includes(name)) throw new Error('Unknown page');
  return { html: await readFile(path.join(process.cwd(), 'content', 'pages', `${name}.html`), 'utf8'), schema: metadata[name].schema };
}
