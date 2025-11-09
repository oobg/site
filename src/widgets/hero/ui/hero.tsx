import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/button';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32 min-h-screen flex items-center">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-purple-900/30 to-primary-800/20"></div>
      <div className="container-custom relative z-10">
        <div className="mx-auto max-w-3xl">
          <div className="glass-card rounded-2xl p-8 sm:p-12 text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl">
              안녕하세요,
              <br />
              <span className="bg-gradient-to-r from-primary-400 to-primary-600 bg-clip-text text-transparent">
                Raven
              </span>
              입니다
            </h1>
            <p className="mb-8 text-lg text-gray-200 sm:text-xl">
              프론트엔드 개발자로, 사용자 경험을 중시하며 아름답고 효율적인 웹 애플리케이션을
              만듭니다.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/blog">
                <Button size="lg" variant="primary">
                  블로그 보기
                </Button>
              </Link>
              <Button size="lg" variant="outline">
                프로젝트 보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

