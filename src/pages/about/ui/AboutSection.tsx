import { motion } from "framer-motion";

import { motionEnter } from "@/shared/lib/motion";

type AboutSectionProps = {
  delay?: number;
  "aria-labelledby": string;
  titleId: string;
  title: string;
  titleSrOnly?: boolean;
  className?: string;
  children: React.ReactNode;
};

export function AboutSection({
  delay = 0,
  "aria-labelledby": ariaLabelledby,
  titleId,
  title,
  titleSrOnly = false,
  className = "mb-2 border-t border-border pt-16 md:pt-20",
  children,
}: AboutSectionProps) {
  return (
    <motion.section
      {...motionEnter}
      transition={{ ...motionEnter.transition, delay }}
      className={className}
      aria-labelledby={ariaLabelledby}
    >
      <h2
        id={titleId}
        className={
          titleSrOnly
            ? "sr-only"
            : "mb-4 text-xs font-medium uppercase tracking-wider text-muted-foreground"
        }
      >
        {title}
      </h2>
      {children}
    </motion.section>
  );
}
