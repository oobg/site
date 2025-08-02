export interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  status: string;
  link?: string;
  category: string;
  year: string;
}

export const projects: Project[] = [
  {
    title: "Raven E-Commerce",
    description: "React, Node.js, MongoDB를 활용한 풀스택 이커머스 플랫폼. 고급 검색, 실시간 재고 관리, 안전한 결제 처리를 제공합니다.",
    tech: ["React", "Node.js", "MongoDB", "Stripe", "Redis"],
    image: "🛒",
    status: "Live",
    link: "https://raven-ecommerce.vercel.app",
    category: "Full-Stack",
    year: "2024"
  },
  {
    title: "AI Raven Assistant",
    description: "OpenAI GPT-4로 구동되는 지능형 챗봇. 맥락을 이해하는 응답을 제공하고 사용자 상호작용으로부터 학습합니다.",
    tech: ["Python", "OpenAI", "FastAPI", "React", "PostgreSQL"],
    image: "🤖",
    status: "Beta",
    link: "https://ai-raven.vercel.app",
    category: "AI/ML",
    year: "2024"
  },
  {
    title: "Raven Portfolio",
    description: "React와 TypeScript로 구축된 현대적인 포트폴리오. 다크모드, 애니메이션, 반응형 디자인을 특징으로 합니다.",
    tech: ["React", "TypeScript", "Vite", "FSD", "Tailwind"],
    image: "💼",
    status: "Live",
    link: "https://raven.kr",
    category: "Frontend",
    year: "2024"
  },
  {
    title: "Raven Analytics",
    description: "실시간 데이터 시각화 대시보드. 복잡한 데이터를 직관적인 차트와 그래프로 표현합니다.",
    tech: ["React", "D3.js", "Node.js", "Socket.io", "MongoDB"],
    image: "📊",
    status: "Live",
    link: "https://raven-analytics.vercel.app",
    category: "Data",
    year: "2023"
  },
  {
    title: "Raven Chat",
    description: "실시간 채팅 애플리케이션. WebSocket을 활용한 즉시 메시지 전송과 파일 공유 기능을 제공합니다.",
    tech: ["React", "Socket.io", "Node.js", "Express", "MongoDB"],
    image: "💬",
    status: "Live",
    link: "https://raven-chat.vercel.app",
    category: "Real-time",
    year: "2023"
  },
  {
    title: "Raven Task Manager",
    description: "팀 협업을 위한 프로젝트 관리 도구. 작업 할당, 진행 상황 추적, 실시간 알림을 지원합니다.",
    tech: ["React", "TypeScript", "Node.js", "PostgreSQL", "Redis"],
    image: "📋",
    status: "Beta",
    link: "https://raven-tasks.vercel.app",
    category: "Productivity",
    year: "2023"
  }
];

export const categories = ["All", "Full-Stack", "Frontend", "AI/ML", "Data", "Real-time", "Productivity"];

export const getStatusColor = (status: string) => {
  return status === 'Live' 
    ? 'bg-green-500 text-white' 
    : 'bg-blue-500 text-white';
};

export const getStatusText = (status: string) => {
  return status === 'Live' ? '서비스중' : '베타';
}; 