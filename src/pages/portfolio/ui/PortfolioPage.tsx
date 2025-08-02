import { useState, useEffect, useRef } from 'react';
import { Header } from '@src/widgets';

interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  status: string;
  link?: string;
  category: string;
  year: string;
}

const projects: Project[] = [
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

const categories = ["All", "Full-Stack", "Frontend", "AI/ML", "Data", "Real-time", "Productivity"];

function PortfolioPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isVisible, setIsVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  const filteredProjects = selectedCategory === "All" 
    ? projects 
    : projects.filter(project => project.category === selectedCategory);

  const projectsPerPage = 3;
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 스크롤 이벤트 핸들러
  useEffect(() => {
    let startY = 0;
    let currentY = 0;
    let isTouching = false;

    const handleWheel = (e: WheelEvent) => {
      const currentSectionElement = document.querySelectorAll('section')[currentSection];
      if (!currentSectionElement) return;

      const sectionRect = currentSectionElement.getBoundingClientRect();
      const sectionHeight = currentSectionElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const isContentOverflow = sectionHeight > viewportHeight;
      
      if (isContentOverflow) {
        // 내용이 화면보다 길 때는 일반 스크롤 허용
        const isAtTop = sectionRect.top >= 0;
        const isAtBottom = sectionRect.bottom <= viewportHeight;
        
        if ((e.deltaY > 0 && isAtBottom && currentSection < 2) || 
            (e.deltaY < 0 && isAtTop && currentSection > 0)) {
          // 페이지 끝에 도달했을 때만 페이지 전환
          e.preventDefault();
          
          if (isScrolling) return;
          setIsScrolling(true);
          
          let nextSection = currentSection;
          if (e.deltaY > 0) {
            nextSection = currentSection + 1;
          } else {
            nextSection = currentSection - 1;
          }
          
          if (nextSection !== currentSection) {
            setCurrentSection(nextSection);
            
            const sections = document.querySelectorAll('section');
            if (sections[nextSection]) {
              sections[nextSection].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
          
          setTimeout(() => {
            setIsScrolling(false);
          }, 800);
        }
      } else {
        // 내용이 화면보다 짧을 때는 즉시 페이지 전환
        e.preventDefault();
        
        if (isScrolling) return;
        setIsScrolling(true);
        
        const delta = e.deltaY;
        let nextSection = currentSection;
        
        if (delta > 0 && currentSection < 2) {
          nextSection = currentSection + 1;
        } else if (delta < 0 && currentSection > 0) {
          nextSection = currentSection - 1;
        }
        
        if (nextSection !== currentSection) {
          setCurrentSection(nextSection);
          
          const sections = document.querySelectorAll('section');
          if (sections[nextSection]) {
            sections[nextSection].scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
        
        setTimeout(() => {
          setIsScrolling(false);
        }, 800);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      isTouching = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTouching || isScrolling) return;
      
      currentY = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isTouching || isScrolling) return;
      
      isTouching = false;
      
      const currentSectionElement = document.querySelectorAll('section')[currentSection];
      if (!currentSectionElement) return;

      const sectionRect = currentSectionElement.getBoundingClientRect();
      const sectionHeight = currentSectionElement.scrollHeight;
      const viewportHeight = window.innerHeight;
      const isContentOverflow = sectionHeight > viewportHeight;
      
      if (isContentOverflow) {
        // 내용이 화면보다 길 때는 페이지 끝에서만 전환
        const isAtTop = sectionRect.top >= 0;
        const isAtBottom = sectionRect.bottom <= viewportHeight;
        
        const deltaY = startY - currentY;
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaY) > minSwipeDistance) {
          if ((deltaY > 0 && isAtBottom && currentSection < 2) || 
              (deltaY < 0 && isAtTop && currentSection > 0)) {
            
            setIsScrolling(true);
            
            let nextSection = currentSection;
            if (deltaY > 0) {
              nextSection = currentSection + 1;
            } else {
              nextSection = currentSection - 1;
            }
            
            if (nextSection !== currentSection) {
              setCurrentSection(nextSection);
              
              const sections = document.querySelectorAll('section');
              if (sections[nextSection]) {
                sections[nextSection].scrollIntoView({
                  behavior: 'smooth',
                  block: 'start'
                });
              }
            }
            
            setTimeout(() => {
              setIsScrolling(false);
            }, 800);
          }
        }
      } else {
        // 내용이 화면보다 짧을 때는 즉시 전환
        setIsScrolling(true);
        
        const deltaY = startY - currentY;
        const minSwipeDistance = 50;
        
        if (Math.abs(deltaY) > minSwipeDistance) {
          let nextSection = currentSection;
          
          if (deltaY > 0 && currentSection < 2) {
            nextSection = currentSection + 1;
          } else if (deltaY < 0 && currentSection > 0) {
            nextSection = currentSection - 1;
          }
          
          if (nextSection !== currentSection) {
            setCurrentSection(nextSection);
            
            const sections = document.querySelectorAll('section');
            if (sections[nextSection]) {
              sections[nextSection].scrollIntoView({
                behavior: 'smooth',
                block: 'start'
              });
            }
          }
        }
        
        setTimeout(() => {
          setIsScrolling(false);
        }, 800);
      }
    };

    const mainElement = mainRef.current;
    if (mainElement) {
      mainElement.addEventListener('wheel', handleWheel, { passive: false });
      mainElement.addEventListener('touchstart', handleTouchStart, { passive: false });
      mainElement.addEventListener('touchmove', handleTouchMove, { passive: false });
      mainElement.addEventListener('touchend', handleTouchEnd, { passive: false });
    }

    return () => {
      if (mainElement) {
        mainElement.removeEventListener('wheel', handleWheel);
        mainElement.removeEventListener('touchstart', handleTouchStart);
        mainElement.removeEventListener('touchmove', handleTouchMove);
        mainElement.removeEventListener('touchend', handleTouchEnd);
      }
    };
  }, [currentSection, isScrolling]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  const getStatusColor = (status: string) => {
    return status === 'Live' 
      ? 'bg-green-500 text-white' 
      : 'bg-blue-500 text-white';
  };

  const getStatusText = (status: string) => {
    return status === 'Live' ? '서비스중' : '베타';
  };

  return (
    <div className="min-h-screen bg-background-primary text-text-primary overflow-x-hidden">
      <Header />
      <main ref={mainRef} className="pt-16 h-screen overflow-y-scroll">
        {/* Hero Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
            isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="mb-8">
              <span className="text-8xl raven-icon-bg">🦅</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 font-apple">
              <span className="text-gradient">Portfolio</span>
            </h1>
            <p className="text-xl sm:text-2xl text-text-secondary mb-12 leading-relaxed font-apple">
              까마귀가 보물을 수집하듯, 혁신과 장인정신을 보여주는<br />
              가장 훌륭한 작품들입니다.
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  className={`px-6 py-3 rounded-full font-medium transition-all duration-300 font-apple ${
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg'
                      : 'bg-background-secondary text-text-secondary hover:text-accent hover:bg-background-tertiary'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Projects Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto w-full">
            {/* Projects Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
              {filteredProjects
                .slice(currentPage * projectsPerPage, (currentPage + 1) * projectsPerPage)
                .map((project, index) => (
                <div 
                  key={index} 
                  className="group relative glass rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-500 apple-shadow overflow-hidden"
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  {/* Project Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-4xl">{project.image}</div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-text-muted font-apple">{project.year}</span>
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}>
                        {getStatusText(project.status)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Project Title */}
                  <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-accent transition-all duration-300 font-apple">
                    {project.title}
                  </h3>
                  
                  {/* Project Description */}
                  <p className="text-text-secondary mb-6 leading-relaxed text-sm font-apple">
                    {project.description}
                  </p>
                  
                  {/* Tech Stack */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {project.tech.map((tech, techIndex) => (
                      <span 
                        key={techIndex} 
                        className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 hover:bg-accent hover:text-white transition-all duration-300 font-apple"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                  
                  {/* Project Link */}
                  {project.link && (
                    <a 
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 text-accent hover:text-accent-hover transition-colors group/link font-apple"
                    >
                      <span className="text-sm font-medium">프로젝트 보기</span>
                      <span className="text-xs group-hover/link:translate-x-1 transition-transform">→</span>
                    </a>
                  )}
                  
                  {/* Hover Effect Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-4">
                <button
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-4 py-2 rounded-lg bg-background-secondary text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-apple"
                >
                  ← 이전
                </button>
                
                <div className="flex space-x-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => handlePageChange(i)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        currentPage === i 
                          ? 'bg-accent' 
                          : 'bg-background-secondary hover:bg-accent/50'
                      }`}
                    />
                  ))}
                </div>
                
                <button
                  onClick={() => handlePageChange(Math.min(totalPages - 1, currentPage + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="px-4 py-2 rounded-lg bg-background-secondary text-text-secondary hover:text-accent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-apple"
                >
                  다음 →
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <div className="mb-8">
              <span className="text-6xl raven-icon-bg">🦅</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-8 font-apple">
              <span className="text-gradient">함께 작업해요</span>
            </h2>
            <p className="text-xl text-text-secondary mb-12 leading-relaxed font-apple">
              새로운 프로젝트에 대한 아이디어가 있으신가요?<br />
              함께 멋진 것을 만들어봐요!
            </p>
            <button className="px-12 py-6 bg-gradient-to-r from-accent to-accent-hover text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 apple-shadow text-lg font-apple">
              연락하기
            </button>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PortfolioPage; 