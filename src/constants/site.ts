export const SITE = {
  name: 'raven.kr',
  author: {
    // API에 author 필드가 없어 여기서 관리한다. 값만 고치면 전역 반영.
    name: 'Raven',
    initials: 'R',
    avatarUrl: null as string | null,
  },
} as const;
