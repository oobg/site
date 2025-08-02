import { Hero, Portfolio, Tools, Contact } from '@src/widgets';
import { Layout } from '@src/shared/ui';

function HomePage() {
  return (
    <Layout>
      <Hero />
      <Portfolio />
      <Tools />
      <Contact />
    </Layout>
  );
}

export default HomePage;
