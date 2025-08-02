interface Project {
  title: string;
  description: string;
  tech: string[];
  image: string;
}

const projects: Project[] = [
  {
    title: "E-Commerce Platform",
    description: "Full-stack e-commerce solution with React, Node.js, and MongoDB",
    tech: ["React", "Node.js", "MongoDB", "Stripe"],
    image: "🛒"
  },
  {
    title: "AI Chat Assistant",
    description: "Intelligent chatbot powered by OpenAI GPT-4",
    tech: ["Python", "OpenAI", "FastAPI", "React"],
    image: "🤖"
  },
  {
    title: "Portfolio Website",
    description: "Modern portfolio built with React and TypeScript",
    tech: ["React", "TypeScript", "Vite", "FSD"],
    image: "💼"
  }
];

export function Portfolio() {
  return (
    <section id="portfolio" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-text-primary">
          Featured Projects
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          Here are some of my recent projects that showcase my skills and creativity.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {projects.map((project, index) => (
          <div key={index} className="bg-background-secondary border border-border rounded-2xl p-8 hover:-translate-y-2 hover:shadow-2xl transition-all duration-300">
            <div className="text-5xl mb-4">{project.image}</div>
            <h3 className="text-2xl font-bold mb-4 text-text-primary">{project.title}</h3>
            <p className="text-text-secondary mb-6 leading-relaxed">{project.description}</p>
            <div className="flex flex-wrap gap-2">
              {project.tech.map((tech, techIndex) => (
                <span key={techIndex} className="px-3 py-1 bg-accent text-white text-sm font-medium rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
