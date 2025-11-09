import { Container } from '@shared/ui/container';

const skills = [
  { name: 'React', level: 90 },
  { name: 'TypeScript', level: 85 },
  { name: 'JavaScript', level: 90 },
  { name: 'Tailwind CSS', level: 80 },
  { name: 'Node.js', level: 75 },
  { name: 'Git', level: 85 },
];

export const Skills = () => {
  return (
    <section id="skills" className="py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <div className="glass-card rounded-2xl p-8 sm:p-12 animate-fade-in-up">
            <h2 className="mb-12 text-center text-4xl sm:text-5xl font-bold text-white">Skills</h2>
            <div className="space-y-6">
              {skills.map((skill, index) => (
                <div
                  key={skill.name}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                >
                  <div className="mb-2 flex justify-between">
                    <span className="font-semibold text-white text-lg">{skill.name}</span>
                    <span className="text-gray-200 font-medium">{skill.level}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-full bg-gray-700/50 backdrop-blur-sm shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 via-primary-600 to-primary-700 transition-all duration-1000 rounded-full shadow-lg"
                      style={{ width: `${skill.level}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
};

