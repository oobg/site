import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";

import { getProjects } from "@/features/projects";
import { useThemeStore } from "@/features/theme";
import {
  avatarImageDark,
  avatarImageLight,
  profileName,
} from "@/shared/content/profile";
import { motionEnter } from "@/shared/lib/motion";

import { AboutCertifications } from "./AboutCertifications";
import { AboutContacts } from "./AboutContacts";
import { AboutEducation } from "./AboutEducation";
import { AboutExternal } from "./AboutExternal";
import { AboutExtra } from "./AboutExtra";
import { AboutFeatured } from "./AboutFeatured";
import { AboutIntro } from "./AboutIntro";
import { AboutSection } from "./AboutSection";
import { AboutSkills } from "./AboutSkills";
import { AboutWork } from "./AboutWork";

const projectsList = getProjects();
const featuredProject =
  projectsList.find(p => p.featured) ?? projectsList[0];

export function AboutPage() {
  const effectiveTheme = useThemeStore(s => s.effectiveTheme);
  const avatarSrc =
    effectiveTheme === "dark" ? avatarImageDark : avatarImageLight;

  return (
    <>
      <Helmet>
        <title>About · {profileName}</title>
        <meta
          name="description"
          content={`${profileName} 소개, 스킬, 경력, 학력, 연락처.`}
        />
      </Helmet>
      <div className="container mx-auto max-w-4xl px-4 py-16 md:py-24">
        <motion.section {...motionEnter} className="mb-2 space-y-6">
          <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
            About
          </h1>
        </motion.section>

        <AboutSection
          delay={0.02}
          aria-labelledby="intro-heading"
          titleId="intro-heading"
          title="소개"
          titleSrOnly
        >
          <AboutIntro avatarSrc={avatarSrc} />
        </AboutSection>

        <AboutSection
          delay={0.03}
          aria-labelledby="contacts-heading"
          titleId="contacts-heading"
          title="Contacts"
        >
          <AboutContacts />
        </AboutSection>

        <AboutSection
          delay={0.04}
          aria-labelledby="skills-heading"
          titleId="skills-heading"
          title="Skills"
          className="mb-4 border-t border-border pt-16 md:pt-20"
        >
          <AboutSkills />
        </AboutSection>

        <AboutSection
          delay={0.05}
          aria-labelledby="work-heading"
          titleId="work-heading"
          title="경력 사항"
        >
          <AboutWork />
        </AboutSection>

        <AboutSection
          delay={0.055}
          aria-labelledby="external-heading"
          titleId="external-heading"
          title="대외 활동"
        >
          <AboutExternal />
        </AboutSection>

        <AboutSection
          delay={0.06}
          aria-labelledby="education-heading"
          titleId="education-heading"
          title="학력"
        >
          <AboutEducation />
        </AboutSection>

        <AboutSection
          delay={0.065}
          aria-labelledby="certs-heading"
          titleId="certs-heading"
          title="자격증"
        >
          <AboutCertifications />
        </AboutSection>

        <AboutSection
          delay={0.07}
          aria-labelledby="extra-heading"
          titleId="extra-heading"
          title="그 외"
        >
          <AboutExtra />
        </AboutSection>

        {featuredProject && (
          <AboutSection
            delay={0.08}
            aria-labelledby="featured-heading"
            titleId="featured-heading"
            title="Featured"
          >
            <AboutFeatured project={featuredProject} />
          </AboutSection>
        )}
      </div>
    </>
  );
}