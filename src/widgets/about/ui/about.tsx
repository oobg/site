import { Container } from '@shared/ui/container';

export const About = () => {
  return (
    <section id="about" className="py-20 min-h-screen flex items-center">
      <Container>
        <div className="mx-auto max-w-3xl">
          <div className="glass-card rounded-2xl p-8 sm:p-12 animate-fade-in-up">
            <h2 className="mb-8 text-center text-4xl sm:text-5xl font-bold text-white">About Me</h2>
            <div className="space-y-5 text-lg sm:text-xl text-gray-200 leading-relaxed">
              <p className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
                프론트엔드 개발에 열정을 가진 개발자입니다. 사용자 중심의 디자인과 최신 기술을
                결합하여 의미 있는 웹 경험을 만드는 것을 좋아합니다.
              </p>
              <p className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
                React, TypeScript, 그리고 현대적인 웹 개발 도구들을 활용하여 확장 가능하고
                유지보수하기 쉬운 코드를 작성하는 것을 목표로 합니다.
              </p>
              <p className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
                지속적인 학습과 개선을 통해 더 나은 개발자가 되기 위해 노력하고 있습니다.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

