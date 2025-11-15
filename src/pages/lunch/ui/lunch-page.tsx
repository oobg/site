import { useState } from 'react';
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
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleRecommend = async () => {
    if (!selectedCategory) return;

    setIsLoading(true);
    setShowResult(false);

    try {
      const result = await menuApi.recommend(selectedCategory);
      setRecommendedMenu(result);
      // 애니메이션을 위한 약간의 지연
      setTimeout(() => {
        setShowResult(true);
        setIsLoading(false);
      }, 300);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('메뉴 추천 실패:', error);
      setIsLoading(false);
    }
  };

  return (
    <Container size="lg" className="py-12 min-h-screen">
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
          오늘 점심 뭐 먹지? 🍽️
        </h1>
        <p className="text-gray-400 text-lg">카테고리를 선택하고 추천받아보세요!</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* 카테고리 선택 */}
        <Card className="mb-8">
          <h2 className="text-2xl font-semibold mb-6 text-center">카테고리 선택</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {CATEGORIES.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => {
                  setSelectedCategory(category.value);
                  setRecommendedMenu(null);
                  setShowResult(false);
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
        </Card>

        {/* 추천 버튼 */}
        <div className="text-center mb-8">
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

        {/* 추천 결과 */}
        {recommendedMenu && (
          <div
            className={`
              transition-all duration-500 ease-out
              ${showResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
            `}
          >
            <Card className="text-center">
              <div className="mb-4">
                <div className="inline-block px-4 py-2 rounded-full bg-primary-600/20 text-primary-300 text-sm font-medium mb-4">
                  {recommendedMenu.category}
                </div>
              </div>
              <div className="text-6xl mb-6 animate-float">
                {CATEGORIES.find((c) => c.label === recommendedMenu.category)?.emoji || '🍽️'}
              </div>
              <h3 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                {recommendedMenu.menu}
              </h3>
              <p className="text-gray-400 mt-4">맛있게 드세요! 😊</p>
            </Card>
          </div>
        )}
      </div>
    </Container>
  );
};
