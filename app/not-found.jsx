import SitePage from '../components/site-page';
import { pageMetadata } from '../lib/pages';

export const metadata = pageMetadata('404');
export default function NotFound() { return <SitePage name="404" />; }
