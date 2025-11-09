import { Container } from '@shared/ui/container';

export const About = () => {
  return (
    <section id="about" className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-3xl sm:text-4xl font-bold text-white">About</h2>
          <div className="space-y-4 text-base sm:text-lg text-gray-300 leading-relaxed">
            <p>
              프론트엔드 개발에 열정을 가진 개발자입니다. 사용자 중심의 디자인과 최신 기술을
              결합하여 의미 있는 웹 경험을 만드는 것을 좋아합니다.
            </p>
            <p>
              React, TypeScript, 그리고 현대적인 웹 개발 도구들을 활용하여 확장 가능하고
              유지보수하기 쉬운 코드를 작성하는 것을 목표로 합니다.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
};

