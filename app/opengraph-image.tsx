import { ImageResponse } from 'next/og';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hero } from '@/content/landing';

export const alt = `smocket · ${hero.h1}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpengraphImage() {
  const rocket = await readFile(join(process.cwd(), 'public/og-rocket.png'));
  const rocketSrc = `data:image/png;base64,${rocket.toString('base64')}`;

  const [lead] = hero.h1.split(hero.h1Accent);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '70px 76px',
          background: '#f5ecdb',
          color: '#241608',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 660 }}>
          <div
            style={{
              fontSize: 30,
              fontWeight: 700,
              letterSpacing: -0.5,
              color: '#241608',
              marginBottom: 18,
            }}
          >
            smocket
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: '#241608' }}>
              {lead.trim()}
            </div>
            <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, color: '#b45f18' }}>
              {hero.h1Accent}
            </div>
          </div>
          <div style={{ marginTop: 34, fontSize: 27, fontWeight: 700, color: '#b45f18' }}>
            {hero.tagline}
          </div>
        </div>

        <img src={rocketSrc} width={400} height={430} alt="" style={{ marginLeft: 24 }} />
      </div>
    ),
    { ...size }
  );
}
