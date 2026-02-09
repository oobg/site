/**
 * 홈/About 등에서 쓰는 프로필·스킬·경력 데이터.
 * 문구·회사 이력은 여기서만 수정하면 됨.
 */

/** 홈 웰컴 페이지 문구 */
export const welcomeTitle = 'raven'
export const welcomeDescription =
  '개인 포트폴리오에 오신 것을 환영합니다.'

/** 홈 웰컴 페이지 하단 섹션 (label = 작은 제목, description = 본문, cta = 버튼/링크 문구) */
export const welcomeSections = {
  intro: {
    label: '이곳은',
    description:
      '소개, 경력, 스킬, 프로젝트를 담은 개인 포트폴리오입니다. 자세한 내용은 About에서 확인할 수 있습니다.',
    cta: 'About 보기',
  },
  projects: {
    label: '프로젝트',
    description: '진행했던 작업과 사이드 프로젝트 목록입니다.',
    cta: 'Projects 보기',
  },
  contact: {
    label: '연락',
    description: '협업·문의는 Contact 페이지에서 편하게 보내주세요.',
    cta: 'Contact',
  },
} as const
export const heroGreeting = '안녕하세요.'
export const heroRoleLabel = 'Frontend Engineer · React'
export const heroDescription =
  '개인 포트폴리오, 채용용, 사이드 프로젝트 쇼케이스.'

/** 짧은 소개 (사진 옆에 노출) */
export const introText =
  '프론트엔드 개발을 주로 하고, 사용자 경험과 코드 품질을 중요하게 생각합니다. 실제 사진으로 교체할 때까지 임시 이미지가 노출됩니다.'

/**
 * 프로필 사진 URL. 다크/라이트 모드별로 교체 가능.
 * 실제 사진 사용 시 public 폴더에 넣고 경로 지정 (예: /avatar.png).
 */
export const avatarImageDark = 'https://picsum.photos/seed/raven-dark/400/400'
export const avatarImageLight =
  'https://picsum.photos/seed/raven-light/400/400'

/** 스킬 태그 (React, TypeScript 형태로 표시) */
export const skills: string[] = [
  'React',
  'TypeScript',
  'Vite',
  'Tailwind',
  'Node',
]

export interface WorkHistoryItem {
  company: string
  role: string
  period: string
  description?: string
}

/** 회사 이력 (최대 3곳) */
export const workHistory: WorkHistoryItem[] = [
  {
    company: '회사명 1',
    role: '역할 (예: 프론트엔드 개발자)',
    period: '2022.01 - 현재',
    description: '한 줄 설명 (선택)',
  },
  {
    company: '회사명 2',
    role: '역할',
    period: '2020.03 - 2021.12',
    description: '',
  },
  {
    company: '회사명 3',
    role: '역할',
    period: '2018.06 - 2020.02',
    description: '',
  },
]
