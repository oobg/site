import { useState, useEffect } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);

  const codeLines = [
    { text: 'const raven = {', type: 'keyword', delay: 0 },
    { text: '  name: "Raven Developer",', type: 'property', delay: 500 },
    { text: '  skills: [', type: 'property', delay: 1000 },
    { text: '    "React",', type: 'string', delay: 1500 },
    { text: '    "TypeScript",', type: 'string', delay: 2000 },
    { text: '    "Node.js",', type: 'string', delay: 2500 },
    { text: '    "Tailwind CSS"', type: 'string', delay: 3000 },
    { text: '  ],', type: 'property', delay: 3500 },
    { text: '  domain: "raven.kr",', type: 'property', delay: 4000 },
    { text: '  spirit: "Soaring through code"', type: 'property', delay: 4500 },
    { text: '};', type: 'keyword', delay: 5000 },
    { text: '// Ready to craft amazing projects', type: 'comment', delay: 5500 }
  ];

  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => setCodeVisible(true), 500);
    
    // 타이핑 애니메이션
    const typingInterval = setInterval(() => {
      setTypingIndex(prev => {
        if (prev < codeLines.length - 1) {
          return prev + 1;
        } else {
          clearInterval(typingInterval);
          return prev;
        }
      });
    }, 500);

    return () => clearInterval(typingInterval);
  }, []);

  const getCodeClass = (type: string) => {
    switch (type) {
      case 'keyword': return 'code-keyword';
      case 'string': return 'code-string';
      case 'property': return 'code-property';
      case 'comment': return 'code-comment';
      default: return 'text-text-primary';
    }
  };

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
          <div className="glass p-8 rounded-2xl raven-shadow code-editor relative">
            <div className="flex items-center mb-4">
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="ml-4 text-xs text-text-muted">raven.js</div>
            </div>
            <div className="font-mono text-sm space-y-1">
              {codeLines.map((line, index) => (
                <div
                  key={index}
                  className={`transition-all duration-500 ${
                    index <= typingIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: `${line.delay}ms`,
                    transform: index <= typingIndex ? 'translateX(0)' : 'translateX(-10px)'
                  }}
                >
                  <span className={getCodeClass(line.type)}>
                    {line.text}
                  </span>
                  {index === typingIndex && (
                    <span className="typing-cursor ml-1">|</span>
                  )}
                </div>
              ))}
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
