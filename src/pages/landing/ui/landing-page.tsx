import { About } from '@src/widgets/about';
import { Contact } from '@src/widgets/contact';
import { Hero } from '@src/widgets/hero';
import { Projects } from '@src/widgets/projects';
import { Skills } from '@src/widgets/skills';

export const LandingPage = () => (
  <>
    <Hero />
    <About />
    <Projects />
    <Skills />
    <Contact />
  </>
);
