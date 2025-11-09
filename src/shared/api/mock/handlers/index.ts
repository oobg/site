import { Server } from 'miragejs';

import { blogHandlers } from './blog';

export const handlers = [
  (server: Server) => {
    blogHandlers(server);
  },
];
