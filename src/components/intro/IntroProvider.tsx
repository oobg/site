'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';
import { INTRO_ATTR, shouldPlayIntro } from './introState';

export interface IntroContextValue {
  /** 도입부 안무가 재생 중인가. */
  playing: boolean;
  /** 페이지 콘텐츠가 등장(fade+12px)해도 되는가. */
  revealed: boolean;
  /** SiteIntro가 안무 핸드오프 시점에 호출 — 콘텐츠를 공개한다. */
  finish: () => void;
}

const IntroContext = createContext<IntroContextValue>({
  playing: false,
  revealed: true,
  finish: () => {},
});

export function useIntro(): IntroContextValue {
  return useContext(IntroContext);
}

function resolveInitial(): { playing: boolean; revealed: boolean } {
  if (typeof document === 'undefined') return { playing: false, revealed: true };
  const play = shouldPlayIntro({
    introState: document.documentElement.dataset[INTRO_ATTR],
    prefersReducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  });
  return { playing: play, revealed: !play };
}

export function IntroProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(resolveInitial);
  const finish = useCallback(() => setState({ playing: false, revealed: true }), []);
  return (
    <IntroContext.Provider value={{ playing: state.playing, revealed: state.revealed, finish }}>
      {children}
    </IntroContext.Provider>
  );
}
