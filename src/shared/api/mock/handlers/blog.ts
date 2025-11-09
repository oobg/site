import { Server } from 'miragejs';

import { blogPosts } from '../factories/blog';

export const blogHandlers = (server: Server) => {
  // Get all blog posts
  server.get('/blog', (_schema, request) => {
    const pageParam = request.queryParams.page;
    const limitParam = request.queryParams.limit;
    const page = parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam || '1', 10);
    const limit = parseInt(Array.isArray(limitParam) ? limitParam[0] : limitParam || '10', 10);
    const start = (page - 1) * limit;
    const end = start + limit;

    const posts = blogPosts.slice(start, end);
    const total = blogPosts.length;

    return {
      data: posts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Get single blog post
  server.get('/blog/:id', (_schema, request) => {
    const idParam = request.params.id;
    const id = Array.isArray(idParam) ? idParam[0] : idParam;
    const post = blogPosts.find((p) => p.id === id);

    if (!post) {
      return { error: 'Post not found' };
    }

    return { data: post };
  });
};
