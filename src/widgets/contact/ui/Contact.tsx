export function Contact() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl raven-icon-bg">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">함께 날아오르자</h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          다음 프로젝트와 함께 비상할 준비가 되었나요? 놀라운 것을 함께 만들어가는 방법을
          논의해보겠습니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📧</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">
              hello@raven.kr
            </span>
          </div>
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📱</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">
              +82 (10) 1234-5678
            </span>
          </div>
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📍</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">
              서울, 대한민국
            </span>
          </div>
        </div>

        <div className="flex justify-center space-x-8">
          <a
            href="#"
            className="text-accent font-medium hover:text-accent-hover transition-all duration-300 group"
          >
            <span className="group-hover:scale-110 transition-transform duration-300">GitHub</span>
          </a>
          <a
            href="#"
            className="text-accent font-medium hover:text-accent-hover transition-all duration-300 group"
          >
            <span className="group-hover:scale-110 transition-transform duration-300">
              LinkedIn
            </span>
          </a>
          <a
            href="#"
            className="text-accent font-medium hover:text-accent-hover transition-all duration-300 group"
          >
            <span className="group-hover:scale-110 transition-transform duration-300">Twitter</span>
          </a>
        </div>
      </div>
    </section>
  );
}
