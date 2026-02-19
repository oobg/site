/**
 * MSW(Mock Service Worker) 진입점.
 * 프로덕션 번들에 포함되지 않도록 main.tsx에서 동적 import로만 호출한다.
 * 활성화 조건: import.meta.env.DEV && import.meta.env.VITE_MSW === "true"
 *
 * MSW 도입 시 예시:
 *   import { setupWorker } from "msw/browser";
 *   import { handlers } from "./handlers";
 *   const worker = setupWorker(...handlers);
 *   export async function start() {
 *     return worker.start({ onUnhandledRequest: "bypass" });
 *   }
 */
export async function start(): Promise<void> {
  // MSW 미설정 시 no-op. 도입 후 worker.start() 등으로 교체.
}
