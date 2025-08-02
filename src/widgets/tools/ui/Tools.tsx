interface Tool {
  name: string;
  description: string;
  icon: string;
}

const tools: Tool[] = [
  {
    name: "Raven Formatter",
    description: "Automatically format your code with raven precision",
    icon: "✨"
  },
  {
    name: "Raven Generator",
    description: "Generate secure passwords with raven intelligence",
    icon: "🔐"
  },
  {
    name: "Raven Palette",
    description: "Create beautiful color schemes for your projects",
    icon: "🎨"
  }
];

export function Tools() {
  return (
    <section id="tools" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <div className="mb-4">
          <span className="text-4xl">🦅</span>
        </div>
        <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-text-primary">
          Raven Tools
        </h2>
        <p className="text-lg sm:text-xl text-text-secondary max-w-3xl mx-auto">
          Tools crafted with raven wisdom to streamline your development workflow.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {tools.map((tool, index) => (
          <div key={index} className="bg-background-secondary border border-border rounded-2xl p-8 text-center hover:-translate-y-2 hover:shadow-2xl transition-all duration-300 raven-shadow">
            <div className="text-5xl mb-4">{tool.icon}</div>
            <h3 className="text-xl font-bold mb-4 text-text-primary">{tool.name}</h3>
            <p className="text-text-secondary mb-6 leading-relaxed">{tool.description}</p>
            <button className="px-6 py-3 border-2 border-accent text-accent font-semibold rounded-lg hover:bg-accent hover:text-white transition-all">
              Try It
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
