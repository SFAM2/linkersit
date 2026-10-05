import { createContactHandlers } from '../../../lib/contact.mjs';

export const runtime = 'nodejs';
export const maxDuration = 30;
export const dynamic = 'force-dynamic';
export async function GET(request) { return createContactHandlers().GET(request); }
export async function POST(request) { return createContactHandlers().POST(request); }
