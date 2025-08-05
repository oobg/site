import { Layout } from "@src/shared/ui";

function AboutPage() {
  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gradient mb-4">About Raven.kr</h1>
          <p className="text-xl text-text-secondary">디지털 하늘을 날아오르는 개발자</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-accent">소개</h2>
            <p className="text-text-secondary leading-relaxed">
              안녕하세요! 저는 프론트엔드 개발자입니다. React, TypeScript, 그리고 최신 웹 기술을
              활용하여 사용자 경험을 향상시키는 애플리케이션을 개발하고 있습니다.
            </p>
            <p className="text-text-secondary leading-relaxed">
              깔끔하고 효율적인 코드 작성, 그리고 사용자 중심의 디자인을 중요하게 생각합니다.
            </p>
          </div>

          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-accent">기술 스택</h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚛️</span>
                <span className="text-text-secondary">React & TypeScript</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🎨</span>
                <span className="text-text-secondary">Tailwind CSS</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">⚡</span>
                <span className="text-text-secondary">Vite</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🦅</span>
                <span className="text-text-secondary">Modern Web Development</span>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <div className="inline-flex items-center space-x-2 text-3xl raven-icon-bg mb-4">
            <span>🦅</span>
            <span className="text-gradient font-bold">Raven.kr</span>
          </div>
          <p className="text-text-muted">디지털 하늘을 날아오르며 더 나은 웹을 만들어갑니다</p>
        </div>
      </div>
    </Layout>
  );
}

export default AboutPage;
