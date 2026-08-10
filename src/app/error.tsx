'use client';

import { Button } from '@components/ui/Button';
import { StatusScreen } from '@/app/_components/StatusScreen';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <StatusScreen
      code="ERROR"
      title="문제가 생겼어요"
      description="잠시 후 다시 시도해 주세요. 계속 같은 화면이면 새로고침이 필요할 수 있어요."
      action={<Button onClick={reset}>다시 시도</Button>}
    />
  );
}
