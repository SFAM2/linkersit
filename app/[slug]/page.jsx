import { notFound } from 'next/navigation';
import SitePage from '../../components/site-page';
import { pageMetadata, pageNames } from '../../lib/pages';

export const dynamicParams = false;
export function generateStaticParams() { return pageNames.map(slug => ({ slug })); }
export async function generateMetadata({ params }) {
  const { slug } = await params;
  return pageNames.includes(slug) ? pageMetadata(slug) : {};
}
export default async function Page({ params }) {
  const { slug } = await params;
  if (!pageNames.includes(slug)) notFound();
  return <SitePage name={slug} />;
}
