import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
