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
        <p>&copy; 2024 DevPortfolio. Built with ❤️ and React.</p>
      </footer>
    </div>
  );
}

export default HomePage;
