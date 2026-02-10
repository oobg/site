export interface BlogPostItem {
  id: string;
  title: string;
  summary: string;
  date: string;
}

export const blogPosts: BlogPostItem[] = [
  {
    id: "1",
    title: "첫 번째 글",
    summary: "요약 텍스트.",
    date: "2025-01-01",
  },
];
