import ky from 'ky';

export interface MenuRecommendResponse {
  category: string;
  menu: string;
}

export type MenuCategory = 'korean' | 'japanese' | 'western' | 'chinese';

const menuApiClient = ky.create({
  prefixUrl: '/api/menu',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const menuApi = {
  recommend: async (category: MenuCategory): Promise<MenuRecommendResponse> => {
    const response = await menuApiClient
      .get('recommend', { searchParams: { category } })
      .json<MenuRecommendResponse>();
    return response;
  },
};
