export interface ProjectItem {
  id: string
  title: string
  summary: string
  role?: string
  stack?: string[]
  links?: { label: string; href: string; external?: boolean }[]
}

export const projects: ProjectItem[] = [
  {
    id: 'raven',
    title: 'raven',
    summary: '개인 포트폴리오 사이트. FSD-lite, React 19, Vite.',
    role: '개인 프로젝트',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind'],
    links: [{ label: 'GitHub', href: 'https://github.com', external: true }],
  },
  {
    id: 'sample',
    title: 'Sample Project',
    summary: '샘플 프로젝트 설명.',
    role: '역할',
    stack: ['React', 'Node'],
    links: [{ label: '링크', href: 'https://example.com', external: true }],
  },
]

export function getProjectById(id: string): ProjectItem | undefined {
  return projects.find((p) => p.id === id)
}
