import { Container } from '@shared/ui/container';
import { Card } from '@shared/ui/card';

export const Contact = () => {
  return (
    <section id="contact" className="bg-gray-800/50 py-20">
      <Container>
        <div className="mx-auto max-w-2xl">
          <h2 className="mb-8 text-center text-4xl font-bold text-white">Contact</h2>
          <Card>
            <div className="space-y-4 text-center">
              <p className="text-lg text-gray-300">
                프로젝트나 협업에 관심이 있으시다면 언제든지 연락주세요.
              </p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <a
                  href="mailto:contact@example.com"
                  className="text-primary-400 hover:text-primary-300"
                >
                  Email
                </a>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300"
                >
                  GitHub
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300"
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </Card>
        </div>
      </Container>
    </section>
  );
};

