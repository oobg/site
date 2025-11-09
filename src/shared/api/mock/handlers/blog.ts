import { Server } from 'miragejs';
import { blogPosts } from '../factories/blog';

export const blogHandlers = (server: Server) => {
  // Get all blog posts
  server.get('/blog', (schema, request) => {
    const page = parseInt(request.queryParams.page || '1', 10);
    const limit = parseInt(request.queryParams.limit || '10', 10);
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
  server.get('/blog/:id', (schema, request) => {
    const id = request.params.id;
    const post = blogPosts.find((p) => p.id === id);

    if (!post) {
      return new Response(404, {}, { error: 'Post not found' });
    }

    return { data: post };
  });
};

