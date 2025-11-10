import ky from 'ky';

export const apiClient = ky.create({
  prefixUrl: '/api/notion',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});
