export const SITE = {
  name: 'raven.kr',
  author: {
    // API에 author 필드가 없어 여기서 관리한다. 값만 고치면 전역 반영.
    name: '배윤석',
    initials: 'BY',
    // 프로필 이미지를 준비하면 경로(public 기준 또는 절대 URL)를 지정. null이면 이니셜 아바타.
    avatarUrl: '/images/author.png' as string | null,
  },
} as const;
