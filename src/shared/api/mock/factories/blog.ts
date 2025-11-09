export interface BlogPost {
  id: string;
  title: string;
  content: string;
  excerpt: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  readTime: number;
}

export const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'React 19의 새로운 기능들',
    content: `
# React 19의 새로운 기능들

React 19가 출시되면서 많은 흥미로운 기능들이 추가되었습니다.

## 주요 변경사항

### 1. React Compiler
React Compiler가 공식적으로 지원되기 시작했습니다. 이는 개발자가 수동으로 useMemo나 useCallback을 사용할 필요 없이 자동으로 최적화를 수행합니다.

### 2. 서버 컴포넌트
서버 컴포넌트가 더욱 안정적으로 작동하며, 성능이 크게 개선되었습니다.

### 3. 새로운 Hooks
여러 새로운 훅들이 추가되어 개발자 경험이 향상되었습니다.

## 결론

React 19는 더 나은 성능과 개발자 경험을 제공합니다.
    `.trim(),
    excerpt: 'React 19의 새로운 기능들과 변경사항을 살펴봅니다.',
    author: 'Raven',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    tags: ['React', 'Frontend', 'JavaScript'],
    readTime: 5,
  },
  {
    id: '2',
    title: 'TypeScript와 함께하는 타입 안전한 개발',
    content: `
# TypeScript와 함께하는 타입 안전한 개발

TypeScript는 JavaScript에 타입 시스템을 추가하여 더 안전하고 유지보수하기 쉬운 코드를 작성할 수 있게 해줍니다.

## 타입 안전성의 이점

1. **컴파일 타임 에러 발견**: 런타임 전에 오류를 발견할 수 있습니다.
2. **자동완성 향상**: IDE에서 더 나은 자동완성을 제공합니다.
3. **리팩토링 용이**: 타입 정보를 활용해 안전하게 리팩토링할 수 있습니다.

## 베스트 프랙티스

- 엄격한 타입 체크 활성화
- any 타입 사용 최소화
- 유니온 타입과 제네릭 적극 활용
    `.trim(),
    excerpt: 'TypeScript를 활용한 타입 안전한 개발 방법을 알아봅니다.',
    author: 'Raven',
    createdAt: '2024-01-20T14:30:00Z',
    updatedAt: '2024-01-20T14:30:00Z',
    tags: ['TypeScript', 'Programming', 'Best Practices'],
    readTime: 7,
  },
  {
    id: '3',
    title: 'FSD 아키텍처로 프로젝트 구조화하기',
    content: `
# FSD 아키텍처로 프로젝트 구조화하기

Feature-Sliced Design (FSD)는 확장 가능하고 유지보수하기 쉬운 프론트엔드 아키텍처입니다.

## FSD의 레이어

1. **app**: 애플리케이션 초기화
2. **pages**: 페이지 컴포넌트
3. **widgets**: 독립적인 UI 블록
4. **features**: 비즈니스 기능
5. **entities**: 비즈니스 엔티티
6. **shared**: 공유 리소스

## 장점

- 명확한 의존성 규칙
- 확장 가능한 구조
- 팀 협업에 유리
    `.trim(),
    excerpt: 'FSD 아키텍처를 활용한 프로젝트 구조화 방법을 소개합니다.',
    author: 'Raven',
    createdAt: '2024-01-25T09:15:00Z',
    updatedAt: '2024-01-25T09:15:00Z',
    tags: ['Architecture', 'Frontend', 'FSD'],
    readTime: 6,
  },
];
