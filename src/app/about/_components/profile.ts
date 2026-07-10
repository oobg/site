/* About 정적 콘텐츠 데이터.
   이전 포트폴리오(main-legacy1: src/shared/content/profile.ts)의 실제 프로필에서 옮겨왔다.
   문구·경력은 여기서만 수정한다.
   개인화 확인 필요: 연차·현재 재직 상태는 시점에 따라 갱신. 전화번호는 의도적으로 제외. */

export const name = '배윤석';
export const roleLabel = '프론트엔드 개발자';

export const lead = `안녕하세요. 사용자 경험을 고민하는 ${roleLabel} ${name}입니다.`;

export const body =
  '사용자 편의성과 제품의 안정성을 최우선으로, 더 나은 경험을 제공하는 데 집중합니다. ' +
  '개발은 혼자가 아니라 함께 만들어가는 과정이라 믿고, 다양한 피드백을 수용하며 팀워크를 중요하게 생각합니다.';

export const focus: { title: string; body: string }[] = [
  {
    title: '사용자의 편의성',
    body: '성능 최적화와 최신 기술로 사용자 경험을 개선합니다. 대용량 HTML 문서의 초기 로딩을 12초에서 3초로 줄이고, Canvas 기반 AI 이미지 편집기를 설계·출시했습니다.',
  },
  {
    title: '성장성',
    body: '한 기술에 안주하지 않고 Vue·React 등 다양한 스택을 오가며 역량을 확장합니다. 학습과 실험을 실질적인 성장으로 잇는 것을 중요하게 생각합니다.',
  },
  {
    title: '소통',
    body: '기획·디자인·백엔드 등 다양한 직군과 협업하며, 문제를 조율하고 함께 해결책을 만들어온 경험을 쌓아왔습니다.',
  },
];

export interface ExperienceItem {
  company: string;
  role: string;
  period: string;
}

export const experience: ExperienceItem[] = [
  { company: '(주) 솔라테크', role: '주임', period: '2025.11 - 현재' },
  { company: '(주) 스모어톡', role: '팀원', period: '2025.02 - 2025.11' },
  { company: '(주) 닷', role: '연구원', period: '2022.09 - 2025.01' },
  { company: '(주) 시스템알앤디', role: '주임', period: '2017.12 - 2022.03' },
];

export const stack: string[] = [
  'TypeScript',
  'React',
  'Vue.js',
  'Next.js',
  'Canvas API',
  'Node.js',
  'Docker',
];

export const now =
  '현재 (주)솔라테크에서 지도 기반 태양광 지붕 임대 견적 서비스를 만들고 있고, ' +
  '개인적으로 raven.kr과 콘텐츠 API(api.raven.kr)를 다듬고 있습니다.';

export const connect: { label: string; href: string }[] = [
  { label: 'GitHub', href: 'https://github.com/oobg' },
  { label: 'Blog', href: 'https://blog.osb.im/' },
  { label: 'Email', href: 'mailto:yoonseok.bae98@gmail.com' },
];
