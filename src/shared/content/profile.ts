/**
 * 홈/About 등에서 쓰는 프로필·스킬·경력 데이터.
 * 문구·회사 이력은 여기서만 수정하면 됨.
 */

/** 프로필 이름 */
export const profileName = "배윤석";

/** 홈 웰컴 페이지 문구 */
export const welcomeTitle = "raven";
export const welcomeDescription =
  "사용자 경험을 고민하는 프론트엔드 개발자입니다.";

/** 홈 타이핑 코드 블록에 표시할 줄 (한 번만 재생) */
export const welcomeCodeLines = [
  'const role = "Frontend Engineer";',
  "const years = 4;",
  'const skills = ["React", "TypeScript", "Vue", "Canvas"];',
  'const focus = "UX & Performance";',
  "",
  "export default raven;",
];

/** 홈 웰컴 페이지 하단 섹션 (label = 작은 제목, description = 본문, cta = 버튼/링크 문구) */
export const welcomeSections = {
  intro: {
    label: "프로필",
    description:
      "소개, 경력, 스킬, 프로젝트를 담은 개인 포트폴리오입니다. 자세한 내용은 About에서 확인할 수 있습니다.",
    cta: "About 보기",
  },
  projects: {
    label: "프로젝트",
    description: "진행했던 작업과 사이드 프로젝트 목록입니다.",
    cta: "Projects 보기",
  },
  contact: {
    label: "연락",
    description: "협업·문의는 Contact 페이지에서 편하게 보내주세요.",
    cta: "Contact",
  },
} as const;

export const heroGreeting = "안녕하세요.";
export const heroRoleLabel = "Frontend Engineer";
export const heroDescription =
  "사용자 편의성과 제품의 안정성을 최우선으로, 더 나은 경험을 제공하는 개발자입니다.";

/** 짧은 소개 (사진 옆에 노출) */
export const introText =
  "안녕하세요. 저는 4년 차 프론트엔드 개발자 배윤석입니다. 개발은 혼자가 아닌 함께 만들어가는 과정이라 믿습니다. 다양한 피드백을 적극적으로 수용하며, 팀워크를 중요한 가치로 생각합니다.";

/**
 * About 페이지 소개 문단 (사용자 편의성, 성장성, 소통 등).
 * 섹션 제목과 본문으로 구성.
 */
export const introSections: { title: string; body: string }[] = [
  {
    title: "사용자의 편의성",
    body: "프론트엔드 개발자로서 성능 최적화와 최신 기술 적용을 통해 사용자 경험을 개선하는 데 집중해왔습니다. CKEditor5 기반 WYSIWYG 웹 에디터에서 대용량 HTML 문서의 초기 로딩 시간을 12초에서 3초로 단축한 경험이 있으며, Intersection Observer와 Mutation Observer를 활용한 가상 스크롤로 렌더링 성능을 향상시켰습니다. 또한 2개월 내 Canvas API를 활용한 AI 기반 이미지 웹 편집기를 설계·구현하여 실제 서비스로 출시한 경험이 있습니다.",
  },
  {
    title: "성장성",
    body: "한 기술에 안주하지 않고, Vue와 React 등 다양한 프론트엔드 기술을 경험하며 역량을 확장해왔습니다. 빠르게 변화하는 기술 환경에 유연하게 적응하며, 학습과 실험을 통해 실질적인 성장으로 이어가는 것을 중요하게 생각합니다.",
  },
  {
    title: "소통",
    body: "팀원 간의 원활한 소통이 좋은 제품을 만든다고 믿습니다. 기획자, 디자이너, 백엔드 개발자 등 다양한 직군과의 협업 경험을 통해, 문제를 조율하고 함께 해결책을 도출하는 과정에 적극적으로 참여해왔습니다.",
  },
];

/** 연락처 */
export const contacts = {
  tel: "+82-10-9486-6059",
  email: "yoonseok.bae98@gmail.com",
  blog: "https://blog.osb.im/",
  github: "https://github.com/oobg",
} as const;

/**
 * 프로필 사진 URL. 다크/라이트 모드별로 교체 가능.
 * 실제 사진 사용 시 public 폴더에 넣고 경로 지정 (예: /avatar.png).
 */
export const avatarImageDark = "/assets/profile/dark.png";
export const avatarImageLight = "/assets/profile/light.png";

/** 스킬 태그 (이력서 기준) */
export const skills: string[] = [
  "TypeScript",
  "JavaScript",
  "React",
  "Vue.js",
  "Nuxt.js",
  "CKEditor5",
  "Canvas API",
  "OpenCV.js",
  "Node.js",
  "Pinia",
  "Tailwind",
  "Docker",
  "Linux",
];

export interface WorkHistoryItem {
  company: string;
  role: string;
  period: string;
  description?: string;
}

/** 회사 이력 */
export const workHistory: WorkHistoryItem[] = [
  {
    company: "(주) 솔라테크",
    role: "주임",
    period: "2025.11 - 현재",
    description: `지도 기반 태양광 지붕 임대 셀프 견적 서비스 개발
- Naver Map 기반 지붕 영역 폴리곤 설정 기능 개발
- 태양광 패널 자동 배치 로직 구현
- 대규모 패널 렌더링 환경에서 지도 성능 최적화`,
  },
  {
    company: "(주) 스모어톡",
    role: "팀원",
    period: "2025.02 - 2025.11",
    description: `AI 이미지 생성 서비스 기능 개발
- 웹 기반 이미지 편집 에디터 기능 개발
- 이미지 생성 페이지 UI 구조 개선
- 구독 플랜 및 생성 제한 관리 기능 구현`,
  },
  {
    company: "(주) 닷",
    role: "연구원",
    period: "2022.09 - 2025.01",
    description: `시각장애인을 위한 점자 콘텐츠 제작 웹 서비스 개발
- 점자 파일(BRF, BRL) 웹뷰어 개발
- Canvas 기반 콘텐츠 제작 기능 개발
- 대용량 콘텐츠 렌더링 성능 개선`,
  },
  {
    company: "(주) 시스템알앤디",
    role: "주임",
    period: "2017.12 - 2022.03",
    description: `- 산업용 공장 자동화 설비 제어 및 유지보수
- 스마트 공정 장비 운영 및 제어 시스템 관리`,
  },
];

export interface EducationItem {
  school: string;
  description: string;
  period: string;
}

/** 학력 */
export const education: EducationItem[] = [
  {
    school: "한양 사이버 대학교",
    description: "응용소프트웨어 학과 재학중",
    period: "2023.03 - 현재",
  },
  {
    school: "서울 로봇 고등학교",
    description: "첨단 로봇과 졸업",
    period: "2015.03 - 2017.02",
  },
];

export interface CertificationItem {
  name: string;
  date: string;
}

/** 자격증 */
export const certifications: CertificationItem[] = [
  { name: "전기 기능사", date: "2015.12" },
  { name: "정보처리 기능사", date: "2015.06" },
];

export interface ExternalActivityItem {
  name: string;
  period: string;
}

/** 대외 활동 */
export const externalActivities: ExternalActivityItem[] = [
  { name: "한양 사이버대학교 웹개발 스터디", period: "2024.06 - 2024.09" },
  { name: "KIC Campus 국비 지원 학원", period: "2022.03 - 2022.08" },
];

/** About 페이지 하단 "그 외" 문단 */
export const aboutExtraParagraphs: string[] = [
  "기술은 나누며 성장한다고 믿습니다. 스터디와 기술 블로그를 통해 배운 내용을 체계적으로 정리하며, 반복을 통해 더 깊이 이해하고 실무에 적용하는 데 집중하고 있습니다.",
  "업무 외 시간에는 크롬 확장 프로그램을 포함한 사이드 프로젝트를 통해, 사용자 중심의 UI/UX를 기획하고 주도적으로 구현해보고 있습니다.",
];
