export const SITE = {
  name: 'raven.kr',
  description: '생각을 다듬고 시스템으로 만드는 과정을 기록하는 공간.',
  author: {
    // API에 author 필드가 없어 여기서 관리한다. 값만 고치면 전역 반영.
    name: 'Raven',
    initials: 'R',
    avatarUrl: null as string | null,
  },
} as const;
