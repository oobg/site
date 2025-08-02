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
        <div className="mb-2">
          <span className="text-2xl">🦅</span>
        </div>
        <p>&copy; 2024 Raven.kr. Built with ❤️ and React.</p>
        <p className="text-sm mt-2">Soaring through the digital skies</p>
      </footer>
    </div>
  );
}

export default HomePage;
