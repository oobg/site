// 블로그 목록용 타입 (간소화된 구조)
export interface BlogPostListItem {
  id: string;
  title: string;
  category: string;
  tags: string[];
  createdBy: string;
  created: string;
  edited: string;
}

// 블로그 상세용 타입 (새로운 구조)
export interface BlogPost {
  id: string;
  title: string;
  category: string;
  tags: string[];
  createdBy: string;
  created: string;
  edited: string;
  content: string; // 마크다운 문자열
}
