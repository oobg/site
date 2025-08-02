export function Contact() {
  return (
    <section id="contact" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-text-primary">
          Let's Work Together
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          Ready to bring your ideas to life? Let's discuss your next project.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <div className="space-y-6">
          <div className="flex items-center space-x-4 text-lg">
            <span className="text-2xl">📧</span>
            <span className="text-text-primary">hello@devportfolio.com</span>
          </div>
          <div className="flex items-center space-x-4 text-lg">
            <span className="text-2xl">📱</span>
            <span className="text-text-primary">+1 (555) 123-4567</span>
          </div>
          <div className="flex items-center space-x-4 text-lg">
            <span className="text-2xl">📍</span>
            <span className="text-text-primary">San Francisco, CA</span>
          </div>
        </div>
        <div className="flex justify-center space-x-8">
          <a href="#" className="text-accent font-medium hover:text-accent-hover transition-colors">
            GitHub
          </a>
          <a href="#" className="text-accent font-medium hover:text-accent-hover transition-colors">
            LinkedIn
          </a>
          <a href="#" className="text-accent font-medium hover:text-accent-hover transition-colors">
            Twitter
          </a>
        </div>
      </div>
    </section>
  );
}
