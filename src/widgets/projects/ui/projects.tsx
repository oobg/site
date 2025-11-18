import { Link } from 'react-router-dom';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';

const projects = [
  {
    id: 'blog',
    title: '블로그 플랫폼',
    description: '마크다운 기반의 블로그 플랫폼입니다. 카테고리 필터링과 무한 스크롤 기능을 제공합니다.',
    tech: ['React', 'TypeScript', 'React Query', 'React Markdown'],
    path: '/blog',
  },
  {
    id: 'calculator',
    title: '금융 계산기',
    description: '19개의 다양한 금융 계산기를 제공합니다. 전세대출이자, 주택대출, 적금/예금, 연금, 부동산 관련 계산 등 다양한 금융 계산을 간편하게 할 수 있습니다.',
    tech: ['React', 'TypeScript', 'Tailwind CSS'],
    path: '/calculator',
  },
  {
    id: 'json-generator',
    title: 'JSON 생성기',
    description: '타입과 옵션을 설정하여 랜덤 JSON 데이터를 생성합니다. 개발 및 테스트에 유용한 도구입니다.',
    tech: ['React', 'TypeScript', 'Vite'],
    path: '/json-generator',
  },
  {
    id: 'lunch',
    title: '점심 메뉴 추천',
    description: '카테고리별 메뉴 추천 기능입니다. 한식, 일식, 양식, 중식 중에서 선택하여 오늘의 점심 메뉴를 추천받을 수 있습니다.',
    tech: ['React', 'TypeScript', 'React Query'],
    path: '/lunch',
  },
];

export const Projects = () => (
  <section id="projects" className="py-16 sm:py-24">
    <Container>
      <h2 className="mb-12 text-center text-3xl sm:text-4xl font-bold text-white">Projects</h2>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
        {projects.map((project) => (
          <Link key={project.id} to={project.path}>
            <Card hover>
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
          </Link>
        ))}
      </div>
    </Container>
  </section>
);
