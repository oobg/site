import { Container } from '@src/shared/ui/container';

export const About = () => (
  <section id="about" className="py-16 sm:py-24">
    <Container>
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-8 text-center text-3xl sm:text-4xl font-bold text-white">About</h2>
        <div className="space-y-4 text-base sm:text-lg text-gray-300 leading-relaxed">
          <p>
            프론트엔드 개발자로, React 19와 TypeScript를 기반으로 사용자 중심의 웹 애플리케이션을 개발합니다.
            FSD(Feature-Sliced Design) 아키텍처를 적용하여 확장 가능하고 유지보수하기 쉬운 코드를 작성하는 것을 지향합니다.
          </p>
          <p>
            블로그 플랫폼, 금융 계산기, JSON 생성기 등 다양한 프로젝트를 통해 실무 경험을 쌓아왔습니다.
            React Query를 활용한 서버 상태 관리, Zustand를 통한 클라이언트 상태 관리, 그리고 Vite를 이용한
            빠른 개발 환경 구축에 익숙합니다.
          </p>
          <p>
            타입 안전성을 중시하며, ESLint와 Prettier를 통한 코드 품질 관리와 테스트를 통해 안정적인
            애플리케이션을 만드는 것을 목표로 합니다.
          </p>
        </div>
      </div>
    </Container>
  </section>
);
