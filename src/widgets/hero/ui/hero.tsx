import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/button';

export const Hero = () => {
  return (
    <section className="relative overflow-hidden py-20 sm:py-32">
      {/* 장식적 그라데이션 원들 */}
      <div className="gradient-orb gradient-orb-1"></div>
      <div className="gradient-orb gradient-orb-2"></div>
      <div className="gradient-orb gradient-orb-3"></div>
      
      <div className="container-custom relative z-10">
        <div className="mx-auto max-w-4xl">
          <div className="glass-card rounded-3xl p-8 sm:p-16 text-center animate-fade-in-up">
            <h1 className="mb-6 text-6xl font-extrabold tracking-tight text-white sm:text-7xl lg:text-8xl">
              <span className="block mb-2 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                안녕하세요,
              </span>
              <span 
                className="block bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent animate-fade-in"
                style={{ animationDelay: '0.4s' }}
              >
                Raven
              </span>
              <span className="block text-4xl sm:text-5xl lg:text-6xl font-bold text-white/90 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                입니다
              </span>
            </h1>
            <p className="mb-10 text-xl text-gray-200 sm:text-2xl leading-relaxed animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
              프론트엔드 개발자로, 사용자 경험을 중시하며
              <br className="hidden sm:block" />
              <span className="text-primary-300"> 아름답고 효율적인</span> 웹 애플리케이션을 만듭니다.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-fade-in-up" style={{ animationDelay: '1s' }}>
              <Link to="/blog">
                <Button size="lg" variant="primary" className="glass-button text-white font-semibold px-8 py-4 text-lg">
                  블로그 보기
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="glass-button-outline text-primary-300 font-semibold px-8 py-4 text-lg">
                프로젝트 보기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

