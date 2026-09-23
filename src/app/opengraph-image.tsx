import { ImageResponse } from 'next/og';

export const alt = 'raven.kr — 제품과 소프트웨어를 만들며 배운 것을 기록합니다.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const runtime = 'edge';

// Satori requires a static TTF for Korean glyphs. This file is a 400-weight
// static instance of the bundled Pretendard Variable WOFF2 (SIL OFL 1.1).
// The illustration is a 1200x630 clay render in the same style as post thumbnails.
// It keeps its left half empty for the text below, so the image never carries text itself.

export default async function OpenGraphImage() {
  const [pretendard, illustration] = await Promise.all([
    fetch(new URL('../styles/fonts/Pretendard-Regular.ttf', import.meta.url)).then((response) =>
      response.arrayBuffer(),
    ),
    fetch(new URL('./_og/og-illustration.png', import.meta.url)).then((response) =>
      response.arrayBuffer(),
    ),
  ]);

  return new ImageResponse(
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        display: 'flex',
        background: '#eef3fb',
        color: '#1a1f26',
        fontFamily: 'Pretendard',
      }}
    >
      <img
        src={illustration as unknown as string}
        width={size.width}
        height={size.height}
        alt=""
        style={{ position: 'absolute', inset: 0 }}
      />
      <div
        style={{
          position: 'relative',
          width: 720,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: '#2f66c4' }}>
          raven.kr
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em' }}>
            생각을 다듬고
          </div>
          <div style={{ display: 'flex', fontSize: 64, fontWeight: 700, letterSpacing: '-0.04em' }}>
            시스템으로 만듭니다
          </div>
          <div style={{ display: 'flex', fontSize: 28, color: '#68707c', wordBreak: 'keep-all' }}>
            제품과 소프트웨어를 만들며 배운 것을 기록합니다.
          </div>
        </div>
        <div style={{ display: 'flex', width: 96, height: 8, background: '#3d7de5' }} />
      </div>
    </div>,
    { ...size, fonts: [{ name: 'Pretendard', data: pretendard, weight: 400 }] },
  );
}
