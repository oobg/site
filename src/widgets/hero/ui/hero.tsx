import { Button } from '@src/shared/ui/button';
import { Link } from 'react-router-dom';

export const Hero = () => (
  <section className="relative overflow-hidden py-24 sm:py-32 lg:py-40">
    {/* 장식적 그라데이션 원들 - 더 미묘하게 */}
    <div className="gradient-orb gradient-orb-1 opacity-30" />
    <div className="gradient-orb gradient-orb-2 opacity-20" />

    <div className="container-custom relative z-10">
      <div className="mx-auto max-w-4xl text-center">
        <div className="animate-fade-in-up">
          <h1 className="mb-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
            <span className="block mb-3">
              저는{' '}
              <span className="bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                Raven{' '}
              </span>
              입니다
            </span>
          </h1>
          <p className="mb-8 text-lg text-gray-300 sm:text-xl max-w-2xl mx-auto text-balance break-keep">
            React 19와 TypeScript로 확장 가능한 웹 애플리케이션을 개발합니다. FSD 아키텍처를 활용하여
            유지보수하기 쉬운 코드를 작성하고, 타입 안전성과 사용자 경험을 최우선으로 생각합니다.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/blog" className="cursor-pointer">
              <Button size="lg" variant="primary">
                블로그 보기
              </Button>
            </Link>
            {/* <a href="#projects">
                <Button size="lg" variant="outline">
                  프로젝트 보기
                </Button>
              </a> */}
          </div>
        </div>
      </div>
    </div>
  </section>
);
