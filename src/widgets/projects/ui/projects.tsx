import { Container } from '@shared/ui/container';
import { Card } from '@shared/ui/card';

const projects = [
  {
    id: '1',
    title: '포트폴리오 웹사이트',
    description: 'React와 TypeScript를 활용한 개인 포트폴리오 웹사이트입니다.',
    tech: ['React', 'TypeScript', 'Tailwind CSS'],
  },
  {
    id: '2',
    title: '블로그 플랫폼',
    description: '마크다운 기반의 블로그 플랫폼입니다.',
    tech: ['React', 'TypeScript', 'Vite'],
  },
  {
    id: '3',
    title: 'E-commerce 플랫폼',
    description: '전자상거래를 위한 웹 애플리케이션입니다.',
    tech: ['React', 'Node.js', 'PostgreSQL'],
  },
];

export const Projects = () => {
  return (
    <section id="projects" className="py-20 min-h-screen flex items-center glass-section">
      <Container>
        <div className="mb-12 text-center animate-fade-in-up">
          <h2 className="text-4xl sm:text-5xl font-bold text-white">Projects</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project, index) => (
            <Card
              key={project.id}
              hover
              className="animate-fade-in-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <h3 className="mb-2 text-xl font-semibold text-white">{project.title}</h3>
              <p className="mb-4 text-gray-200">{project.description}</p>
              <div className="flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <span
                    key={tech}
                    className="rounded-full bg-primary-900/50 px-3 py-1 text-sm text-primary-300 backdrop-blur-sm"
                  >
                    {tech}
                  </span>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
};

