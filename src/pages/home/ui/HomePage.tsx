import { Layout } from "@src/shared/ui";
import { Hero, Portfolio, Tools, Contact } from "@src/widgets";

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
