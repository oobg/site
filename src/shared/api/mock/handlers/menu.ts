import { Server, Request } from 'miragejs';

// 카테고리별 메뉴 목록
const menuData: Record<string, string[]> = {
  korean: [
    '김치찌개',
    '된장찌개',
    '비빔밥',
    '불고기',
    '삼겹살',
    '갈비탕',
    '설렁탕',
    '순두부찌개',
    '제육볶음',
    '닭볶음탕',
    '추어탕',
    '해물파전',
    '냉면',
    '육개장',
    '보쌈',
  ],
  japanese: [
    '라멘',
    '돈까스',
    '초밥',
    '우동',
    '카레',
    '오므라이스',
    '규동',
    '가츠동',
    '오야코동',
    '타코야키',
    '오코노미야키',
    '사시미',
    '텐동',
    '나베',
    '야키니쿠',
  ],
  western: [
    '파스타',
    '피자',
    '스테이크',
    '햄버거',
    '샐러드',
    '리조또',
    '샌드위치',
    '치킨',
    '그라탕',
    '라자냐',
    '뇨끼',
    '크림스프',
    '치즈버거',
    '피쉬앤칩스',
    '팬케이크',
  ],
  chinese: [
    '짜장면',
    '짬뽕',
    '탕수육',
    '양장피',
    '마파두부',
    '깐풍기',
    '유산슬',
    '고추잡채',
    '볶음밥',
    '양꼬치',
    '마라탕',
    '훠궈',
    '샤오롱바오',
    '딤섬',
    '팔보채',
  ],
};

export const menuHandlers = (server: Server) => {
  // GET /api/menu/recommend?category={category}
  server.get('/menu/recommend', (_schema: unknown, request: Request) => {
    const categoryParam = request.queryParams.category;
    const category = Array.isArray(categoryParam) ? categoryParam[0] : categoryParam;

    if (!category) {
      return new Response(JSON.stringify({ error: 'Category parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const menus = menuData[category];
    if (!menus || menus.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid category' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 랜덤으로 메뉴 선택
    const randomMenu = menus[Math.floor(Math.random() * menus.length)];

    // 카테고리 한글명 매핑
    const categoryMap: Record<string, string> = {
      korean: '한식',
      japanese: '일식',
      western: '양식',
      chinese: '중식',
    };

    return {
      category: categoryMap[category] || category,
      menu: randomMenu,
    };
  });
};
