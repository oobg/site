'use client';

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main>
      <h1>문제가 생겼어요</h1>
      <button onClick={reset}>다시 시도</button>
    </main>
  );
}
