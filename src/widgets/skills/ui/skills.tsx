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
    <section id="skills" className="py-16 sm:py-24">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-12 text-center text-3xl sm:text-4xl font-bold text-white">Skills</h2>
          <div className="space-y-5">
            {skills.map((skill) => (
              <div key={skill.name}>
                <div className="mb-2 flex justify-between">
                  <span className="font-medium text-white">{skill.name}</span>
                  <span className="text-gray-300 text-sm">{skill.level}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-700/50">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-1000 rounded-full"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
};

