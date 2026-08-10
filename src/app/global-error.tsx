'use client';

// 루트 레이아웃까지 무너진 경우라 html·body와 전역 스타일을 여기서 직접 세운다.
import './globals.css';
import { sans, mono } from '@styles/fonts';
import { Button } from '@components/ui/Button';
import { StatusScreen } from '@/app/_components/StatusScreen';

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ko" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <StatusScreen
          code="ERROR"
          title="문제가 생겼어요"
          description="페이지를 불러오지 못했어요. 다시 시도해도 같으면 잠시 후 방문해 주세요."
          action={<Button onClick={reset}>다시 시도</Button>}
        />
      </body>
    </html>
  );
}
