import { useState, useEffect } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [dynamicSkill, setDynamicSkill] = useState('');
  const [skillIndex, setSkillIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);

  const staticSkills = ['React', 'TypeScript'];
  const dynamicSkills = ['Vue', 'Node.js', 'Next.js'];

  const codeLines = [
    { text: 'const raven = {', type: 'keyword', delay: 0 },
    { text: '  name: "Raven Developer",', type: 'property', delay: 0 },
    { text: '  skills: [', type: 'property', delay: 0 },
    { text: '    "React",', type: 'string', delay: 0 },
    { text: '    "TypeScript",', type: 'string', delay: 0 },
    { text: '    "' + dynamicSkill + '",', type: 'string', delay: 0, isDynamic: true },
    { text: '  ],', type: 'property', delay: 0 },
    { text: '  domain: "raven.kr",', type: 'property', delay: 0 },
    { text: '  spirit: "Soaring through code"', type: 'property', delay: 0 },
    { text: '};', type: 'keyword', delay: 0 },
    { text: '// Ready to craft amazing projects', type: 'comment', delay: 0 }
  ];

  useEffect(() => {
    setIsVisible(true);
    setTimeout(() => setCodeVisible(true), 500);
    
    // 모든 코드가 한번에 나타나도록 수정
    setTypingIndex(codeLines.length - 1);
  }, []);

  // 동적 스킬 타이핑 애니메이션
  useEffect(() => {
    if (codeVisible) { // 코드가 보이기 시작하면
      const startDynamicSkills = () => {
        let currentSkillIndex = 0;
        
        const typeSkill = () => {
          setIsTyping(true);
          setDynamicSkill(dynamicSkills[currentSkillIndex]);
          
          // 타이핑 완료 후 잠시 대기
          setTimeout(() => {
            setIsTyping(false);
            
            // 다음 스킬로 이동
            setTimeout(() => {
              currentSkillIndex = (currentSkillIndex + 1) % dynamicSkills.length;
              typeSkill();
            }, 1000); // 1초 대기 후 다음 스킬
          }, 2000); // 2초간 타이핑 (CSS 애니메이션과 맞춤)
        };
        
        typeSkill();
      };
      
      setTimeout(startDynamicSkills, 2000); // 2초 후 시작
    }
  }, [codeVisible]);

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
                  className={`code-line transition-all duration-500 ${
                    index <= typingIndex ? 'opacity-100' : 'opacity-0'
                  }`}
                  style={{ 
                    transitionDelay: `${line.delay}ms`,
                    transform: index <= typingIndex ? 'translateX(0)' : 'translateX(-10px)'
                  }}
                >
                  <span className={getCodeClass(line.type)}>
                    {line.isDynamic ? (
                      <>
                        <span dangerouslySetInnerHTML={{ __html: line.text.replace('"' + dynamicSkill + '",', '') }} />
                        "<span className={`dynamic-skill ${isTyping ? 'typing' : ''}`}>{dynamicSkill}</span>",
                      </>
                    ) : (
                      <span dangerouslySetInnerHTML={{ __html: line.text }} />
                    )}
                  </span>
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
