import SitePage from '../components/site-page';
import { pageMetadata } from '../lib/pages';

export const metadata = pageMetadata('index');
export default function Home() { return <SitePage name="index" />; }
