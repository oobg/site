import { projects } from "../model/projects";

export function Portfolio() {
  return (
    <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl raven-icon-bg">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">주요 프로젝트</h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          까마귀가 보물을 수집하듯, 혁신과 장인정신을 보여주는 가장 훌륭한 작품들 중 일부입니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <div
            key={index}
            className="group relative mystical-card rounded-2xl p-8 hover:-translate-y-2 hover:shadow-lg transition-all duration-300 raven-shadow overflow-hidden"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  project.status === "Live" ? "bg-green-500 text-white" : "bg-blue-500 text-white"
                }`}
              >
                {project.status === "Live" ? "서비스중" : "베타"}
              </span>
            </div>

            {/* Project Icon */}
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
              {project.image}
            </div>

            {/* Project Title */}
            <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-accent transition-all duration-300">
              {project.title}
            </h3>

            {/* Project Description */}
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              {project.description}
            </p>

            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech.map((tech, techIndex) => (
                <span
                  key={techIndex}
                  className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 hover:bg-accent hover:text-white transition-all duration-300"
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
                className="inline-flex items-center space-x-2 text-accent hover:text-accent-hover transition-colors group/link"
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

      <div className="text-center mt-12">
        <button className="px-8 py-4 bg-gradient-to-r from-accent to-accent-hover text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 raven-shadow">
          모든 프로젝트 보기
        </button>
      </div>
    </section>
  );
}
