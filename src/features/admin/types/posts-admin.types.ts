export type PostStatus = 'draft' | 'published';

export interface AdminPost {
  id: string;
  title: string;
  slug: string;
  description: string;
  body: string;
  status: PostStatus;
  published_at: string | null;
  created_at: string;
  updated_at: string;
  cover_image_url?: string | null;
}

export interface PostActionState {
  status: 'idle' | 'success' | 'error';
  message: string;
  postId?: string;
  fieldErrors?: Record<string, string[]>;
  updatedAt?: string;
}

export const initialPostActionState: PostActionState = { status: 'idle', message: '' };
