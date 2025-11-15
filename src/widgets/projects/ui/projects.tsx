import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';

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
  // {
  //   id: '3',
  //   title: 'E-commerce 플랫폼',
  //   description: '전자상거래를 위한 웹 애플리케이션입니다.',
  //   tech: ['React', 'Node.js', 'PostgreSQL'],
  // },
];

export const Projects = () => (
  <section id="projects" className="py-16 sm:py-24">
    <Container>
      <h2 className="mb-12 text-center text-3xl sm:text-4xl font-bold text-white">Projects</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {projects.map((project) => (
          <Card key={project.id} hover>
            <h3 className="mb-3 text-xl font-semibold text-white">{project.title}</h3>
            <p className="mb-4 text-gray-300">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech) => (
                <span
                  key={tech}
                  className="rounded-full bg-primary-900/50 px-3 py-1 text-sm text-primary-300"
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
