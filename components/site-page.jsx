import { pageContent, siteUrl } from '../lib/pages';

// Build-time, repository-owned HTML preserves the approved design exactly.
// No visitor input or remotely fetched HTML is rendered here.
export default async function SitePage({ name }) {
  const { html, schema } = await pageContent(name);
  const structuredData = schema ? { ...JSON.parse(schema), '@id': `${siteUrl}/#organization`, url: siteUrl } : null;
  return <>
    <div data-site-page={name} style={{ display: 'contents' }} dangerouslySetInnerHTML={{ __html: html }} />
    {structuredData && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll('<', '\\u003c') }} />}
  </>;
}
