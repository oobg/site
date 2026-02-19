export const motionEnter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: "easeOut" as const },
};

export const SCALE_KEYS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;

export const DEFAULT_SEED_HEX = "#7c3aed";

export type SeedMode = "random" | "picker";
export type SeedTone = "light" | "dark";
