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
          <div className="mb-4">
            <span className="text-6xl">🦅</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span 
              className="text-gradient"
              style={{
                background: 'linear-gradient(135deg, #2d3748, #805ad5)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Raven Developer
            </span>
            <br />
            <span className="text-text-primary">Soaring Through Code</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-8 leading-relaxed">
            Like a raven navigating the digital skies, I craft elegant solutions 
            and build powerful applications. Specialized in React, TypeScript, 
            and modern web technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-raven-primary to-raven-accent text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all raven-shadow"
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View My Work
            </button>
            <button 
              className="px-8 py-4 border-2 border-border text-text-primary font-semibold rounded-lg hover:bg-background-secondary hover:border-accent transition-all"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="glass p-8 rounded-2xl raven-shadow animate-float">
            <div className="font-mono text-sm space-y-2">
              <div className="text-text-primary">const raven = {`{`}</div>
              <div className="text-text-primary ml-4">name: "Raven Developer",</div>
              <div className="text-text-primary ml-4">skills: ["React", "TypeScript"],</div>
              <div className="text-text-primary ml-4">domain: "raven.kr",</div>
              <div className="text-text-primary ml-4">spirit: "Soaring through code"</div>
              <div className="text-text-primary">{`}`}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
