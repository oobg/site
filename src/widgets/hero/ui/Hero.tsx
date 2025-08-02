import { useState, useEffect } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`min-h-screen flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto ${
      isVisible ? 'animate-fade-in' : 'opacity-0 translate-y-8'
    }`}>
      <div className="flex flex-col lg:flex-row items-center gap-12 w-full">
        <div className="flex-1 max-w-2xl">
          <div className="mb-6">
            <span className="text-6xl raven-icon-bg">🦅</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-gradient">
              Raven Developer
            </span>
            <br />
            <span className="text-text-primary">코드를 통해 날아오르다</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-8 leading-relaxed">
            까마귀가 디지털 하늘을 탐험하듯, 우아한 솔루션을 만들고 
            강력한 애플리케이션을 구축합니다. React, TypeScript, 
            그리고 현대적인 웹 기술에 특화되어 있습니다.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-accent to-accent-hover text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-300 raven-shadow"
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
            >
              작업물 보기
            </button>
            <button 
              className="px-8 py-4 border-2 border-border text-text-primary font-semibold rounded-lg hover:bg-background-secondary hover:border-accent hover:text-accent transition-all duration-300"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              연락하기
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="glass p-8 rounded-2xl raven-shadow">
            <div className="font-mono text-sm space-y-2">
              <div className="text-text-primary">const raven = {`{`}</div>
              <div className="text-text-accent ml-4">name: "Raven Developer",</div>
              <div className="text-text-accent ml-4">skills: ["React", "TypeScript"],</div>
              <div className="text-text-accent ml-4">domain: "raven.kr",</div>
              <div className="text-text-accent ml-4">spirit: "Soaring through code"</div>
              <div className="text-text-primary">{`}`}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <div className="text-xs text-text-muted">
                <span className="text-accent">●</span> 다음 프로젝트를 함께 만들어갈 준비가 되었습니다
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
