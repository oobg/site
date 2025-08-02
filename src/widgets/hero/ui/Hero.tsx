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
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            <span 
              className="text-gradient"
              style={{
                background: 'linear-gradient(135deg, #646cff, #ff6b6b)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}
            >
              Creative Developer
            </span>
            <br />
            <span className="text-text-primary">Building Digital Experiences</span>
          </h1>
          <p className="text-lg sm:text-xl text-text-secondary mb-8 leading-relaxed">
            Passionate about creating innovative solutions and beautiful user experiences. 
            Specialized in React, TypeScript, and modern web technologies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="px-8 py-4 bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-0.5 transition-all"
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
          <div className="glass p-8 rounded-2xl shadow-2xl animate-float">
            <div className="font-mono text-sm space-y-2">
              <div className="text-text-primary">const developer = {`{`}</div>
              <div className="text-text-primary ml-4">name: "Creative Dev",</div>
              <div className="text-text-primary ml-4">skills: ["React", "TypeScript"],</div>
              <div className="text-text-primary ml-4">passion: "Building amazing apps"</div>
              <div className="text-text-primary">{`}`}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
