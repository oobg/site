export interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  status: string;
  link?: string;
}

export const projects: Project[] = [
  {
    title: "Raven E-Commerce",
    description:
      "React, Node.js, MongoDB를 활용한 풀스택 이커머스 플랫폼. 고급 검색, 실시간 재고 관리, 안전한 결제 처리를 제공합니다.",
    tech: ["React", "Node.js", "MongoDB", "Stripe", "Redis"],
    image: "🛒",
    status: "Live",
    link: "https://raven-ecommerce.vercel.app",
  },
  {
    title: "AI Raven Assistant",
    description:
      "OpenAI GPT-4로 구동되는 지능형 챗봇. 맥락을 이해하는 응답을 제공하고 사용자 상호작용으로부터 학습합니다.",
    tech: ["Python", "OpenAI", "FastAPI", "React", "PostgreSQL"],
    image: "🤖",
    status: "Beta",
    link: "https://ai-raven.vercel.app",
  },
  {
    title: "Raven Portfolio",
    description:
      "React와 TypeScript로 구축된 현대적인 포트폴리오. 다크모드, 애니메이션, 반응형 디자인을 특징으로 합니다.",
    tech: ["React", "TypeScript", "Vite", "FSD", "Tailwind"],
    image: "💼",
    status: "Live",
    link: "https://raven.kr",
  },
];
