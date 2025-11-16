import { useState, useEffect } from 'react';
import { Button } from '@src/shared/ui/button';
import { Card } from '@src/shared/ui/card';
import { Container } from '@src/shared/ui/container';
import { menuApi, type MenuCategory } from '@src/shared/api/menu';

const CATEGORIES: Array<{ value: MenuCategory; label: string; emoji: string }> = [
  { value: 'korean', label: '한식', emoji: '🍚' },
  { value: 'japanese', label: '일식', emoji: '🍜' },
  { value: 'western', label: '양식', emoji: '🍝' },
  { value: 'chinese', label: '중식', emoji: '🥢' },
];

export const LunchPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | null>(null);
  const [recommendedMenu, setRecommendedMenu] = useState<{
    category: string;
    menu: string;
    icon?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  // 페이지 title 설정
  useEffect(() => {
    const defaultTitle = 'Raven - Portfolio & Blog';
    document.title = '점심 메뉴 추천 | Raven';
    return () => {
      document.title = defaultTitle;
    };
  }, []);

  const handleRecommend = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);

    try {
      const result = await menuApi.recommend(selectedCategory);
      setRecommendedMenu(result);
      // API 응답 후 카드 플립 애니메이션 시작
      setTimeout(() => {
        setIsLoading(false);
        setIsFlipped(true);
      }, 300);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('메뉴 추천 실패:', error);
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setIsFlipped(false);
    setRecommendedMenu(null);
  };

  return (
    <Container size="lg" className="py-12 pb-32 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          오늘 점심 뭐 먹지? 🍽️
        </h1>
        <p className="text-gray-400 text-lg">카테고리를 선택하고 추천받아보세요!</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 플립 카드 컨테이너 */}
        <div
          className="mb-8"
          style={{
            perspective: '1000px',
          }}
        >
          <div
            className="relative w-full"
            style={{
              transformStyle: 'preserve-3d',
              transition: 'transform 0.6s',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* 앞면: 카테고리 선택 */}
            <div
              className="w-full"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(0deg)',
              }}
            >
              <Card className="mb-8">
                <h2 className="text-2xl font-semibold mb-6 text-center">카테고리 선택</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category.value}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(category.value);
                        setRecommendedMenu(null);
                        setIsFlipped(false);
                      }}
                      className={`
                        p-6 rounded-xl transition-all duration-300 h-32 flex flex-col items-center justify-center
                        ${
                          selectedCategory === category.value
                            ? 'bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg shadow-primary-500/50 border-2 border-primary-400'
                            : 'glass-card hover:shadow-lg border-2 border-transparent'
                        }
                      `}
                    >
                      <div className="text-4xl mb-2">{category.emoji}</div>
                      <div className={`font-medium ${selectedCategory === category.value ? 'text-white' : 'text-gray-300'}`}>
                        {category.label}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="text-center">
                  <Button
                    onClick={handleRecommend}
                    disabled={!selectedCategory || isLoading}
                    size="lg"
                    className="min-w-[200px]"
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        추천 중...
                      </span>
                    ) : (
                      '메뉴 추천받기 ✨'
                    )}
                  </Button>
                </div>
              </Card>
            </div>

            {/* 뒷면: 추천 결과 */}
            <div
              className="w-full absolute top-0 left-0"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
              }}
            >
              {recommendedMenu && (
                <Card className="text-center">
                  <div className="mb-4">
                    <div className="inline-block px-4 py-2 rounded-full bg-primary-600/20 text-primary-300 text-sm font-medium mb-4">
                      {recommendedMenu.category}
                    </div>
                  </div>
                  <div className="text-6xl mb-6 animate-float">
                    {recommendedMenu.icon
                      || CATEGORIES.find((c) => c.label === recommendedMenu.category)?.emoji
                      || '🍽️'}
                  </div>
                  <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                    {recommendedMenu.menu}
                  </h3>
                  <p className="text-gray-400 mt-4 mb-6">맛있게 드세요! 😊</p>
                  <Button onClick={handleReset} variant="outline" size="md">
                    다시 선택하기
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};
