/* 사이트 소개 콘텐츠. 홈과 About이 공유하는 단일 출처.
   개인을 식별할 수 있는 이름·경력·연락처는 포함하지 않는다.

   페이지별 역할 분담:
   - 홈    — lead·now만 쓴다.
   - About — 사이트 소개·관심 주제·기술·공개 서비스 링크를 쓴다. */

export const name = 'raven.kr';
export const roleLabel = '기술 기록';

export const lead = `${name}은 제품과 소프트웨어를 만들며 배운 것을 정리하는 ${roleLabel} 공간입니다.`;

export const body =
  '복잡한 문제를 명료한 인터페이스와 안정적인 시스템으로 풀어가는 과정을 기록합니다.';

/** 사이트에서 다루는 주제. */
export const exploring: { title: string; body: string }[] = [
  {
    title: 'Better Interfaces',
    body: '복잡함을 숨기지 않고 오히려 명료하게 드러내는 인터페이스.',
  },
  {
    title: 'AI & Systems',
    body: '생성 도구를 넘어 사고의 파트너로서의 AI.',
  },
  {
    title: 'Knowledge Infrastructure',
    body: '코드만이 아니라 사고를 확장하는 시스템 만들기.',
  },
];

export const focus: { title: string; body: string }[] = [
  {
    title: '사용자의 편의성',
    body: '성능과 접근성을 함께 살피며 사용하기 편한 인터페이스를 탐구합니다.',
  },
  {
    title: '성장성',
    body: '학습과 실험에서 얻은 내용을 재사용할 수 있는 지식으로 정리합니다.',
  },
  {
    title: '소통',
    body: '문제와 선택의 근거를 분명하게 남겨 협업에 필요한 맥락을 공유합니다.',
  },
];

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
}

export const experience: ExperienceItem[] = [];

export const stack: string[] = [
  'TypeScript',
  'React',
  'Vue.js',
  'Next.js',
  'Canvas API',
  'Node.js',
  'Docker',
];

export const now = '블로그와 글 작성 화면을 다듬으며 개발 과정에서 얻은 지식을 기록하고 있습니다.';

export const connect: { label: string; href: string }[] = [];
