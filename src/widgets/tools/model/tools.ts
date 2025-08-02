export interface Tool {
  name: string;
  description: string;
  icon: string;
  features: string[];
  status: string;
}

export const tools: Tool[] = [
  {
    name: "Raven Formatter",
    description:
      "까마귀의 정밀함으로 코드를 자동 포맷팅합니다. 다양한 언어와 커스텀 규칙을 지원합니다.",
    icon: "✨",
    features: ["다중 언어", "커스텀 규칙", "Git 통합"],
    status: "Ready",
  },
  {
    name: "Raven Generator",
    description:
      "까마귀의 지능으로 안전한 비밀번호를 생성합니다. 복잡하면서도 기억하기 쉬운 비밀번호를 만듭니다.",
    icon: "🔐",
    features: ["안전함", "기억하기 쉬움", "커스터마이징"],
    status: "Ready",
  },
  {
    name: "Raven Palette",
    description: "프로젝트를 위한 아름다운 색상 조합을 만듭니다. AI 기반 색상 조화.",
    icon: "🎨",
    features: ["AI 기반", "내보내기", "미리보기"],
    status: "Beta",
  },
];
