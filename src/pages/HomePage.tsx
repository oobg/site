import { Header, Hero, Portfolio, Tools, Contact } from '@src/widgets';

function HomePage() {
  return (
    <div className="min-h-screen bg-background-primary text-text-primary">
      <Header />
      <main className="pt-16">
        <Hero />
        <Portfolio />
        <Tools />
        <Contact />
      </main>
      <footer className="text-center py-8 border-t border-border text-text-secondary">
        <div className="mb-4">
          <span className="text-3xl">🦅</span>
        </div>
        <p className="text-gradient">&copy; 2024 Raven.kr. Built with ❤️ and React.</p>
        <p className="text-sm mt-2 text-text-muted">Soaring through the digital skies</p>
      </footer>
    </div>
  );
}

export default HomePage;
