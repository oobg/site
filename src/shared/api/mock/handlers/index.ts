import { Server } from 'miragejs';

import { blogHandlers } from './blog';
import { menuHandlers } from './menu';

export const handlers = [
  (server: Server) => {
    blogHandlers(server);
  },
  (server: Server) => {
    menuHandlers(server);
  },
];
