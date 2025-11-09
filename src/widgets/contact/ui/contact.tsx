import { Container } from '@shared/ui/container';

export const Contact = () => (
  <section id="contact" className="py-16 sm:py-24">
    <Container>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="mb-6 text-3xl sm:text-4xl font-bold text-white">Contact</h2>
        <p className="mb-8 text-gray-300">
          프로젝트나 협업에 관심이 있으시다면 언제든지 연락주세요.
        </p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <a
            href="mailto:contact@raven.kr"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            Email
          </a>
          <span className="text-gray-600">•</span>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            GitHub
          </a>
          <span className="text-gray-600">•</span>
          <a
            href="https://linkedin.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-400 hover:text-primary-300 transition-colors"
          >
            LinkedIn
          </a>
        </div>
      </div>
    </Container>
  </section>
);
