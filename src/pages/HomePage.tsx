import { Header, Hero, Portfolio, Tools, Contact } from '@src/widgets';

function HomePage() {
  return (
    <div className="min-h-screen mystical-bg text-text-primary">
      <Header />
      <main className="pt-16">
        <Hero />
        <Portfolio />
        <Tools />
        <Contact />
      </main>
      <footer className="text-center py-8 border-t border-border-glow text-text-secondary mystical-card">
        <div className="mb-4">
          <span className="text-3xl floating">🦅</span>
        </div>
        <p className="text-gradient text-glow">&copy; 2024 Raven.kr. Built with ❤️ and React.</p>
        <p className="text-sm mt-2 text-text-muted">Soaring through the digital skies</p>
        <div className="mt-4 flex justify-center space-x-4">
          <span className="text-xs text-text-muted">Made with mystical powers</span>
        </div>
      </footer>
    </div>
  );
}

export default HomePage;
