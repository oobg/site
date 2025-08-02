export function Contact() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-gradient">
          Let's Soar Together
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          Ready to take flight with your next project? Let's discuss how we can build something amazing.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📧</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">hello@raven.kr</span>
          </div>
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📱</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">+82 (10) 1234-5678</span>
          </div>
          <div className="flex items-center space-x-4 text-lg group">
            <span className="text-2xl">📍</span>
            <span className="text-text-primary group-hover:text-accent transition-all duration-300">Seoul, South Korea</span>
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
            <span className="group-hover:scale-110 transition-transform duration-300">LinkedIn</span>
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
