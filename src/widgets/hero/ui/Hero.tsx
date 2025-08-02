import { useState, useEffect } from 'react';

export function Hero() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <section className={`min-h-screen flex items-center px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mystical-bg ${
      isVisible ? 'animate-fade-in' : 'opacity-0 translate-y-8'
    }`}>
      <div className="flex flex-col lg:flex-row items-center gap-12 w-full">
        <div className="flex-1 max-w-2xl">
          <div className="mb-6">
            <span className="text-8xl floating">🦅</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span className="text-gradient text-glow">
              Raven Developer
            </span>
            <br />
            <span className="text-text-primary text-neon">Soaring Through Code</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-8 leading-relaxed">
            Like a raven navigating the digital skies, I craft elegant solutions 
            and build powerful applications. Specialized in React, TypeScript, 
            and modern web technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-accent to-neon-purple text-white font-semibold rounded-lg hover:shadow-glow hover:-translate-y-1 transition-all duration-300 raven-shadow-glow pulse-glow"
              onClick={() => document.getElementById('portfolio')?.scrollIntoView({ behavior: 'smooth' })}
            >
              View My Work
            </button>
            <button 
              className="px-8 py-4 border-2 border-border-glow text-text-primary font-semibold rounded-lg hover:bg-background-secondary hover:border-accent hover:text-accent transition-all duration-300 hover:shadow-glow"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get In Touch
            </button>
          </div>
        </div>
        
        <div className="flex-1 flex justify-center">
          <div className="glass-glow p-8 rounded-2xl raven-shadow-glow animate-float mystical-card">
            <div className="font-mono text-sm space-y-2">
              <div className="text-text-primary shimmer">const raven = {`{`}</div>
              <div className="text-text-accent ml-4">name: "Raven Developer",</div>
              <div className="text-text-accent ml-4">skills: ["React", "TypeScript"],</div>
              <div className="text-text-accent ml-4">domain: "raven.kr",</div>
              <div className="text-text-accent ml-4">spirit: "Soaring through code"</div>
              <div className="text-text-primary">{`}`}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-border-glow">
              <div className="text-xs text-text-muted">
                <span className="text-neon">●</span> Ready to craft your next project
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mystical Background Elements */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-neon rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-20 w-1 h-1 bg-accent rounded-full animate-pulse"></div>
      <div className="absolute bottom-20 left-1/4 w-1 h-1 bg-neon-purple rounded-full animate-pulse"></div>
    </section>
  );
}
