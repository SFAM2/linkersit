import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const dynamic = 'force-static';

export async function GET() {
  const logo = await readFile(path.join(process.cwd(), 'public/assets/logo.png'));
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '66px 76px', background: 'linear-gradient(125deg, #090a10 30%, #23134e 75%, #4826df 120%)', color: '#ffffff', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <img src={`data:image/png;base64,${logo.toString('base64')}`} width={364} height={61} alt="LinkersIT" />
        <span style={{ fontSize: 21, color: '#c5bcdf', letterSpacing: 3 }}>PARIS · TUNIS</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 28 }}>
        <span style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, lineHeight: 1.08 }}>Technology consulting.</span>
        <span style={{ fontSize: 72, fontWeight: 700, letterSpacing: -3, lineHeight: 1.08, color: '#b9a5ff' }}>Ideas into impact.</span>
        <span style={{ fontSize: 26, color: '#d2cede', marginTop: 28 }}>Strategy, engineering &amp; product delivery.</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ffffff30', paddingTop: 24, fontSize: 21, color: '#c5bcdf' }}>
        <span>For consulting firms, enterprises &amp; startups.</span>
        <span style={{ color: '#ffffff' }}>linkersit.com</span>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
