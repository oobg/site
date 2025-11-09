import { createServer } from 'miragejs';
import { handlers } from './handlers';

export const createMockServer = () => {
  if (import.meta.env.MODE === 'development') {
    return createServer({
      environment: 'development',
      routes() {
        this.namespace = 'api';
        handlers.forEach((handler) => handler(this));
      },
    });
  }
  return null;
};

