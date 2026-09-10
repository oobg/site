export interface Comment {
  id: string;
  nickname: string;
  avatar_id: string;
  body: string;
  created_at: string;
}

export interface CommentPage {
  items: Comment[];
  total: number;
  nextCursor: string | null;
}

export interface AdminComment extends Comment {
  post_slug: string;
  moderation_status: 'visible' | 'hidden';
}
