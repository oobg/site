interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
  status: string;
  link?: string;
}

const projects: Project[] = [
  {
    title: "Raven E-Commerce",
    description: "Full-stack e-commerce platform with React, Node.js, and MongoDB. Features advanced search, real-time inventory, and secure payment processing.",
    tech: ["React", "Node.js", "MongoDB", "Stripe", "Redis"],
    image: "🛒",
    status: "Live",
    link: "https://raven-ecommerce.vercel.app"
  },
  {
    title: "AI Raven Assistant",
    description: "Intelligent chatbot powered by OpenAI GPT-4. Provides contextual responses and learns from user interactions.",
    tech: ["Python", "OpenAI", "FastAPI", "React", "PostgreSQL"],
    image: "🤖",
    status: "Beta",
    link: "https://ai-raven.vercel.app"
  },
  {
    title: "Raven Portfolio",
    description: "Modern portfolio built with React and TypeScript. Features dark mode, animations, and responsive design.",
    tech: ["React", "TypeScript", "Vite", "FSD", "Tailwind"],
    image: "💼",
    status: "Live",
    link: "https://raven.kr"
  }
];

export function Portfolio() {
  return (
    <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-6">
          <span className="text-6xl animate-bounce">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-text-primary">
          Featured Projects
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          Like a raven collecting treasures, here are some of my finest works that showcase innovation and craftsmanship.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <div 
            key={index} 
            className="group relative bg-background-secondary border border-border rounded-2xl p-8 hover:-translate-y-4 hover:shadow-2xl transition-all duration-500 raven-shadow overflow-hidden"
          >
            {/* Status Badge */}
            <div className="absolute top-4 right-4">
              <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                project.status === 'Live' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-yellow-500 text-white'
              }`}>
                {project.status}
              </span>
            </div>
            
            {/* Project Icon */}
            <div className="text-6xl mb-6 group-hover:scale-110 transition-transform duration-300">
              {project.image}
            </div>
            
            {/* Project Title */}
            <h3 className="text-2xl font-bold mb-4 text-text-primary group-hover:text-accent transition-colors">
              {project.title}
            </h3>
            
            {/* Project Description */}
            <p className="text-text-secondary mb-6 leading-relaxed text-sm">
              {project.description}
            </p>
            
            {/* Tech Stack */}
            <div className="flex flex-wrap gap-2 mb-6">
              {project.tech.map((tech, techIndex) => (
                <span 
                  key={techIndex} 
                  className="px-3 py-1 bg-accent/10 text-accent text-xs font-medium rounded-full border border-accent/20 hover:bg-accent hover:text-white transition-all duration-300"
                >
                  {tech}
                </span>
              ))}
            </div>
            
            {/* Project Link */}
            {project.link && (
              <a 
                href={project.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-accent hover:text-accent-hover transition-colors group/link"
              >
                <span className="text-sm font-medium">View Project</span>
                <span className="text-xs group-hover/link:translate-x-1 transition-transform">→</span>
              </a>
            )}
            
            {/* Hover Effect Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
          </div>
        ))}
      </div>
      
      {/* Call to Action */}
      <div className="text-center mt-16">
        <p className="text-text-secondary mb-4">Want to see more of my work?</p>
        <button className="px-8 py-4 bg-gradient-to-r from-raven-primary to-raven-accent text-white font-semibold rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all raven-shadow">
          View All Projects
        </button>
      </div>
    </section>
  );
}
