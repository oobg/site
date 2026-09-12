/**
 * OpenAPI 3.1 specification for raven.kr public and admin HTTP APIs.
 * This object is served verbatim by GET /api/docs (production-only, Cloudflare Access–gated).
 * Keep it in sync with the actual route implementations and docs/api.md.
 */
export const apiSpecification = {
  openapi: '3.1.0',
  info: {
    title: 'Raven HTTP API',
    version: '2.0.0',
    description:
      'Public blog and admin CMS API for raven.kr. Public read endpoints require no authentication. Admin endpoints require Cloudflare Access JWT or a Google owner session from the same origin.',
  },
  servers: [{ url: 'https://raven.kr', description: 'Production' }],

  components: {
    securitySchemes: {
      CloudflareAccessJwt: {
        type: 'apiKey',
        in: 'header',
        name: 'Cf-Access-Jwt-Assertion',
        description:
          'Cloudflare Access JWT assertion forwarded by the edge. RS256, issuer = team origin, audience = app AUD.',
      },
      RevalidateSecret: {
        type: 'apiKey',
        in: 'header',
        name: 'x-revalidate-secret',
        description: 'Shared secret matching the REVALIDATE_SECRET environment variable.',
      },
    },

    schemas: {
      // ── Shared primitives ───────────────────────────────────────────────────
      ErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: {
          error: {
            type: 'object',
            required: ['code', 'message'],
            properties: {
              code: { type: 'string', example: 'POST_NOT_FOUND' },
              message: { type: 'string', example: '글을 찾을 수 없습니다.' },
            },
          },
        },
      },
      LegacyErrorEnvelope: {
        type: 'object',
        required: ['error'],
        properties: { error: { type: 'string', example: 'unauthorized' } },
      },

      // ── Category ────────────────────────────────────────────────────────────
      Category: {
        type: 'object',
        required: ['id', 'slug', 'name', 'sort_order'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'engineering' },
          name: { type: 'string', example: '엔지니어링' },
          sort_order: { type: 'integer', minimum: 0 },
        },
      },

      // ── Post list item (public) ─────────────────────────────────────────────
      PostListItem: {
        type: 'object',
        required: ['slug', 'title', 'tags', 'status'],
        properties: {
          slug: { type: 'string', example: 'design-system' },
          title: { type: 'string', example: '디자인 시스템 기록' },
          summary: { type: 'string', nullable: true, example: '설계와 구현 과정을 정리했습니다.' },
          tags: { type: 'array', items: { type: 'string' } },
          published_at: { type: 'string', format: 'date-time', nullable: true },
          updated_at: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['published'] },
          category: { $ref: '#/components/schemas/Category', nullable: true },
          cover_image_key: { type: 'string', nullable: true },
          cover_image_url: { type: 'string', format: 'uri', nullable: true },
          cover_position: {
            type: 'object',
            required: ['x', 'y'],
            properties: {
              x: { type: 'number', minimum: 0, maximum: 1 },
              y: { type: 'number', minimum: 0, maximum: 1 },
            },
          },
          cover_alt: { type: 'string', nullable: true },
          pin_order: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
        },
      },

      // ── Post detail (public) ────────────────────────────────────────────────
      PostDetail: {
        allOf: [
          { $ref: '#/components/schemas/PostListItem' },
          {
            type: 'object',
            required: ['body_markdown', 'frontmatter'],
            properties: {
              body_markdown: { type: 'string', example: '# 기록\n\n본문입니다.' },
              frontmatter: { type: 'object', additionalProperties: true },
            },
          },
        ],
      },

      // ── Posts home (GET /api/posts) ─────────────────────────────────────────
      PostsHome: {
        type: 'object',
        required: ['featured', 'categories', 'sections', 'archive'],
        properties: {
          featured: { type: 'array', items: { $ref: '#/components/schemas/PostListItem' } },
          categories: { type: 'array', items: { $ref: '#/components/schemas/Category' } },
          sections: { type: 'object', additionalProperties: true },
          archive: {
            type: 'object',
            required: ['items', 'page', 'pageSize', 'totalItems', 'totalPages'],
            properties: {
              items: { type: 'array', items: { $ref: '#/components/schemas/PostListItem' } },
              page: { type: 'integer', minimum: 1 },
              pageSize: { type: 'integer', minimum: 1, maximum: 100 },
              totalItems: { type: 'integer', minimum: 0 },
              totalPages: { type: 'integer', minimum: 0 },
            },
          },
        },
      },

      // ── Comment (public) ────────────────────────────────────────────────────
      Comment: {
        type: 'object',
        required: ['id', 'nickname', 'avatar_id', 'body', 'created_at'],
        properties: {
          id: { type: 'string', format: 'uuid' },
          nickname: { type: 'string', minLength: 1, maxLength: 20, example: '독자' },
          avatar_id: { type: 'string', example: 'clay-01' },
          body: { type: 'string', minLength: 1, maxLength: 1000 },
          created_at: { type: 'string', format: 'date-time' },
        },
      },

      CommentsPage: {
        type: 'object',
        required: ['items', 'total'],
        properties: {
          items: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
          total: { type: 'integer', minimum: 0 },
          nextCursor: {
            type: 'string',
            nullable: true,
            description: 'base64url-encoded cursor; pass as ?cursor= in next request',
          },
        },
      },

      CommentInput: {
        type: 'object',
        required: ['nickname', 'avatar_id', 'body'],
        properties: {
          nickname: { type: 'string', minLength: 1, maxLength: 20, example: '독자' },
          avatar_id: {
            type: 'string',
            pattern: '^clay-(?:[1-9]|[1-5][0-9]|6[0-4])$',
            example: 'clay-01',
          },
          body: { type: 'string', minLength: 1, maxLength: 1000, example: '좋은 글 감사합니다.' },
        },
      },

      // ── Admin post (full, db record) ────────────────────────────────────────
      AdminPost: {
        type: 'object',
        required: [
          'id',
          'slug',
          'title',
          'description',
          'body',
          'status',
          'created_at',
          'updated_at',
        ],
        properties: {
          id: { type: 'string', format: 'uuid' },
          slug: { type: 'string', example: 'design-system' },
          title: { type: 'string', example: '디자인 시스템 기록' },
          description: { type: 'string', example: '설계와 구현 과정을 정리했습니다.' },
          body: { type: 'string', description: 'Raw Markdown body (body_markdown alias)' },
          status: { type: 'string', enum: ['draft', 'published'] },
          category_id: { type: 'string', format: 'uuid', nullable: true },
          tags: { type: 'array', items: { type: 'string' } },
          cover_image_key: { type: 'string', nullable: true },
          cover_image_url: { type: 'string', format: 'uri', nullable: true },
          cover_position_x: { type: 'number', minimum: 0, maximum: 1, nullable: true },
          cover_position_y: { type: 'number', minimum: 0, maximum: 1, nullable: true },
          cover_alt: { type: 'string', nullable: true },
          pin_order: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
          published_at: { type: 'string', format: 'date-time', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },

      AdminPostInput: {
        type: 'object',
        required: ['title', 'slug', 'description', 'body', 'status'],
        properties: {
          title: { type: 'string', minLength: 1, maxLength: 160, example: '디자인 시스템 기록' },
          slug: {
            type: 'string',
            minLength: 1,
            maxLength: 160,
            pattern: '^[가-힣a-z0-9]+(?:[-][가-힣a-z0-9]+)*$',
            example: 'design-system',
          },
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 500,
            example: '설계와 구현 과정을 정리했습니다.',
          },
          body: {
            type: 'string',
            minLength: 1,
            maxLength: 200000,
            description: 'Raw Markdown; not HTML',
          },
          status: { type: 'string', enum: ['draft', 'published'] },
          category_id: {
            type: 'string',
            format: 'uuid',
            nullable: true,
            default: '00000000-0000-4000-8000-000000000001',
          },
          tags: {
            oneOf: [
              {
                type: 'array',
                items: { type: 'string', minLength: 1, maxLength: 80 },
                maxItems: 30,
              },
              { type: 'string', description: 'Comma-separated; items are lowercased and trimmed' },
            ],
            default: [],
          },
          cover_image_key: {
            type: 'string',
            nullable: true,
            pattern:
              '^assets/posts/[0-9]{4}-[0-9]{2}-[0-9]{2}/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\\.(jpg|png|gif|webp)$',
          },
          cover_alt: { type: 'string', minLength: 1, maxLength: 300, nullable: true },
          cover_position_x: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
          cover_position_y: { type: 'number', minimum: 0, maximum: 1, default: 0.5 },
          published_at: { type: 'string', format: 'date-time', nullable: true },
          pin_order: { type: 'integer', minimum: 1, maximum: 5, nullable: true },
        },
      },

      // ── Upload response ──────────────────────────────────────────────────────
      UploadResult: {
        type: 'object',
        required: ['path', 'url', 'publicUrl'],
        properties: {
          path: { type: 'string', example: '/assets/posts/2026-09-10/design-system-00-v2.png' },
          url: { type: 'string', example: '/assets/posts/2026-09-10/design-system-00-v2.png' },
          publicUrl: {
            type: 'string',
            format: 'uri',
            example: 'https://cdn.raven.kr/assets/posts/2026-09-10/design-system-00-v2.png',
          },
        },
      },

      // ── Revalidate ──────────────────────────────────────────────────────────
      RevalidateInput: {
        type: 'object',
        properties: {
          changed: {
            type: 'array',
            maxItems: 100,
            default: [],
            items: {
              type: 'object',
              required: ['type', 'slug'],
              properties: {
                type: { type: 'string', enum: ['post', 'project'] },
                slug: { type: 'string', minLength: 1, maxLength: 200 },
              },
            },
          },
        },
      },
      RevalidateResult: {
        type: 'object',
        required: ['revalidated', 'count'],
        properties: {
          revalidated: { type: 'boolean', const: true },
          count: { type: 'integer', minimum: 0 },
        },
      },
    },

    responses: {
      Forbidden: {
        description: 'Forbidden',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      Unauthorized: {
        description: 'Unauthorized',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      NotFound: {
        description: 'Not found',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      ServerError: {
        description: 'Internal server error',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
      ServiceUnavailable: {
        description: 'Service unavailable (misconfiguration)',
        content: { 'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } } },
      },
    },
  },

  paths: {
    // ── Public posts ─────────────────────────────────────────────────────────
    '/api/posts': {
      get: {
        operationId: 'listPosts',
        summary: 'List published posts',
        description:
          'Returns featured posts, categories, sections, and a paginated archive. No authentication required.',
        tags: ['Public'],
        parameters: [
          {
            name: 'q',
            in: 'query',
            schema: { type: 'string', maxLength: 200 },
            description: 'Full-text search query',
          },
          {
            name: 'category',
            in: 'query',
            schema: { type: 'string' },
            description: 'Category slug filter',
          },
          {
            name: 'tag',
            in: 'query',
            schema: { type: 'string', maxLength: 80 },
            description: 'Tag filter',
          },
          { name: 'page', in: 'query', schema: { type: 'integer', minimum: 1, default: 1 } },
          {
            name: 'pageSize',
            in: 'query',
            schema: { type: 'integer', minimum: 1, maximum: 100, default: 12 },
          },
        ],
        responses: {
          '200': {
            description: 'Posts home data',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/PostsHome' } } },
          },
          '400': {
            description: 'Invalid filter parameters',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        operationId: 'createPublicPostUnsupported',
        summary: 'Public post creation is not supported',
        description:
          'This public route is read-only. Use POST /api/admin/posts with administrator authentication to create a post.',
        tags: ['Public'],
        deprecated: true,
        responses: {
          '405': { description: 'Method not allowed' },
        },
      },
    },

    '/api/posts/{slug}': {
      get: {
        operationId: 'getPost',
        summary: 'Get published post by slug',
        description:
          'Returns a single published post with full Markdown body. Draft or missing posts return 404.',
        tags: ['Public'],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 200 } },
        ],
        responses: {
          '200': {
            description: 'Post detail',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PostDetail' } },
            },
          },
          '400': {
            description: 'Invalid slug',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '404': {
            description: 'Post not found',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        operationId: 'updatePublicPostUnsupported',
        summary: 'Public post updates are not supported',
        description:
          'This public route is read-only. Use PUT /api/admin/posts/{slug} with administrator authentication to create or update a post.',
        tags: ['Public'],
        deprecated: true,
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 200 } },
        ],
        responses: {
          '405': { description: 'Method not allowed' },
        },
      },
    },

    '/api/posts/{slug}/comments': {
      get: {
        operationId: 'listComments',
        summary: 'List comments for a post',
        description:
          'Returns a page of visible comments. Pass `cursor` from `nextCursor` to page forward.',
        tags: ['Public'],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 200 } },
          {
            name: 'cursor',
            in: 'query',
            schema: { type: 'string' },
            description: 'base64url-encoded pagination cursor from nextCursor',
          },
        ],
        responses: {
          '200': {
            description: 'Comment page',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CommentsPage' } },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '404': { $ref: '#/components/responses/NotFound' },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
      post: {
        operationId: 'createComment',
        summary: 'Submit an anonymous comment',
        description:
          'Creates a comment on a published post. Requires `Origin: https://raven.kr` and `Content-Type: application/json`. No authentication required; rate-limited per IP.',
        tags: ['Public'],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 200 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CommentInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Comment created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['comment'],
                  properties: { comment: { $ref: '#/components/schemas/Comment' } },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '415': { $ref: '#/components/responses/NotFound' },
          '429': {
            description: 'Rate limited',
            headers: { 'Retry-After': { schema: { type: 'integer', example: 600 } } },
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── Revalidate ───────────────────────────────────────────────────────────
    '/api/revalidate': {
      post: {
        operationId: 'revalidateCache',
        summary: 'Revalidate Next.js cache tags',
        description:
          'Webhook endpoint for invalidating cached content. Requires `x-revalidate-secret` matching the server REVALIDATE_SECRET. Not a substitute for Cloudflare Access authentication.',
        tags: ['Webhook'],
        security: [{ RevalidateSecret: [] }],
        requestBody: {
          required: false,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RevalidateInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Cache revalidated',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RevalidateResult' } },
            },
          },
          '400': {
            description: 'Invalid payload',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '401': {
            description: 'Missing or wrong secret',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '413': {
            description: 'Payload too large',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/LegacyErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
        },
      },
    },

    // ── Admin posts ──────────────────────────────────────────────────────────
    '/api/admin/posts': {
      post: {
        operationId: 'createAdminPost',
        summary: 'Create a new post',
        description: 'Creates a new post. Returns 409 if the slug already exists.',
        tags: ['Admin'],
        security: [{ CloudflareAccessJwt: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AdminPostInput' } },
          },
        },
        responses: {
          '201': {
            description: 'Post created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['post', 'created'],
                  properties: {
                    post: { $ref: '#/components/schemas/AdminPost' },
                    created: { type: 'boolean', const: true },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': {
            description: 'Slug or pin_order conflict',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '413': {
            description: 'Payload too large',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '422': {
            description: 'Validation or FK constraint error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    '/api/admin/posts/{slug}': {
      get: {
        operationId: 'getAdminPost',
        summary: 'Get post by slug (admin)',
        description:
          'Returns the full post record including draft fields. Returns 404 if the slug does not exist.',
        tags: ['Admin'],
        security: [{ CloudflareAccessJwt: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 160 } },
        ],
        responses: {
          '200': {
            description: 'Post',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['post'],
                  properties: { post: { $ref: '#/components/schemas/AdminPost' } },
                },
              },
            },
          },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '404': { $ref: '#/components/responses/NotFound' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
      put: {
        operationId: 'upsertAdminPost',
        summary: 'Create or update post by slug (admin)',
        description:
          'Full replacement upsert. Returns 201 if created, 200 if updated. Slug in path and body must match.',
        tags: ['Admin'],
        security: [{ CloudflareAccessJwt: [] }],
        parameters: [
          { name: 'slug', in: 'path', required: true, schema: { type: 'string', maxLength: 160 } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/AdminPostInput' } },
          },
        },
        responses: {
          '200': {
            description: 'Post updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['post', 'created'],
                  properties: {
                    post: { $ref: '#/components/schemas/AdminPost' },
                    created: { type: 'boolean', const: false },
                  },
                },
              },
            },
          },
          '201': {
            description: 'Post created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['post', 'created'],
                  properties: {
                    post: { $ref: '#/components/schemas/AdminPost' },
                    created: { type: 'boolean', const: true },
                  },
                },
              },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': {
            description: 'Pin order conflict',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '413': {
            description: 'Payload too large',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '422': {
            description: 'Validation or FK constraint error',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },

    // ── Admin uploads ────────────────────────────────────────────────────────
    '/api/admin/uploads': {
      post: {
        operationId: 'uploadAsset',
        summary: 'Upload an image asset',
        description:
          'Uploads a JPEG/PNG/GIF/WebP image. Validates MIME type and file signature. Max file 10 MiB, max multipart 11 MiB. Returns 409 if the key already exists.',
        tags: ['Admin'],
        security: [{ CloudflareAccessJwt: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'JPEG, PNG, GIF, or WebP image ≤10 MiB',
                  },
                  key: {
                    type: 'string',
                    description:
                      'Optional asset key: assets/posts/YYYY-MM-DD/<name>.<ext>. Generated if omitted.',
                    pattern:
                      '^assets/posts/[0-9]{4}-[0-9]{2}-[0-9]{2}/[A-Za-z0-9][A-Za-z0-9_-]{0,199}\\.(jpg|png|gif|webp)$',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Asset stored',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UploadResult' } },
            },
          },
          '400': { $ref: '#/components/responses/NotFound' },
          '401': { $ref: '#/components/responses/Unauthorized' },
          '403': { $ref: '#/components/responses/Forbidden' },
          '409': {
            description: 'Asset key already exists',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '413': {
            description: 'Payload too large',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '415': {
            description: 'Unsupported image type or signature mismatch',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '422': {
            description: 'Invalid asset key format',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/ErrorEnvelope' } },
            },
          },
          '500': { $ref: '#/components/responses/ServerError' },
          '503': { $ref: '#/components/responses/ServiceUnavailable' },
        },
      },
    },
  },
} as const;
