import { useState, useEffect } from "react";

import { Layout } from "@src/shared/ui";

import { usePortfolioScroll } from "../lib/usePortfolioScroll";
import { projects, categories, getStatusColor, getStatusText } from "../model/projects";

function PortfolioPage() {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isVisible, setIsVisible] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);

  const filteredProjects =
    selectedCategory === "All"
      ? projects
      : projects.filter((project) => project.category === selectedCategory);

  const projectsPerPage = 3;
  const totalPages = Math.ceil(filteredProjects.length / projectsPerPage);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  // 스크롤 이벤트 핸들러
  const mainRef = usePortfolioScroll(
    currentSection,
    setCurrentSection,
    isScrolling,
    setIsScrolling,
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(0);
  };

  return (
    <Layout showFooter={false}>
      <div className="overflow-x-hidden">
        <main ref={mainRef} className="h-screen overflow-y-scroll">
          {/* Hero Section */}
          <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div
              className={`text-center max-w-4xl mx-auto transition-all duration-1000 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              <div className="mb-8">
                <span className="text-8xl raven-icon-bg">🦅</span>
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-8 font-apple">
                <span className="text-gradient">Portfolio</span>
              </h1>
              <p className="text-xl sm:text-2xl text-text-secondary mb-12 leading-relaxed font-apple">
                까마귀가 보물을 수집하듯, 혁신과 장인정신을 보여주는
                <br />
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
                        ? "bg-gradient-to-r from-accent to-accent-hover text-white shadow-lg"
                        : "bg-background-secondary text-text-secondary hover:text-accent hover:bg-background-tertiary"
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
                        animationDelay: `${index * 200}ms`,
                      }}
                    >
                      {/* Project Header */}
                      <div className="flex items-center justify-between mb-6">
                        <div className="text-4xl">{project.image}</div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-text-muted font-apple">{project.year}</span>
                          <span
                            className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(project.status)}`}
                          >
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
                          <span className="text-xs group-hover/link:translate-x-1 transition-transform">
                            →
                          </span>
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
                            ? "bg-accent"
                            : "bg-background-secondary hover:bg-accent/50"
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
                새로운 프로젝트에 대한 아이디어가 있으신가요?
                <br />
                함께 멋진 것을 만들어봐요!
              </p>
              <button className="px-12 py-6 bg-gradient-to-r from-accent to-accent-hover text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 apple-shadow text-lg font-apple">
                연락하기
              </button>
            </div>
          </section>
        </main>
      </div>
    </Layout>
  );
}

export default PortfolioPage;
