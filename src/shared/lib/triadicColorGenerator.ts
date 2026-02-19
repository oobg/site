import { converter, formatHex, type Oklch, parse, wcagContrast } from "culori";

const L_MIN = 0.45;
const L_MAX = 0.75;
const CHROMA_DAMPEN = 0.9;
const HUE_OFFSET = 120;

/** 기본 시드: violet 계열 OKLCH (L=0.6, C=0.15, H=270) */
const DEFAULT_SEED_HEX = "#7c3aed";

const SCALE_KEYS = [100, 200, 300, 400, 500, 600, 700, 800, 900] as const;
/** 100~400, 600~900 고정 L (라이트 모드); 500은 메인색 L 사용 */
const L_FOR_SCALE_EXCEPT_500: Record<
  (typeof SCALE_KEYS)[number],
  number | null
> = {
  100: 0.98,
  200: 0.92,
  300: 0.85,
  400: 0.75,
  500: null,
  600: 0.45,
  700: 0.35,
  800: 0.22,
  900: 0.12,
};

function scaleLForKey(
  key: (typeof SCALE_KEYS)[number],
  mainL: number,
  darkMode: boolean
): number {
  const L = L_FOR_SCALE_EXCEPT_500[key] ?? mainL;
  if (!darkMode) return L;
  return L === mainL ? mainL : 1 - L;
}

export type ColorScale = Record<(typeof SCALE_KEYS)[number], string>;

export interface TriadicPalette {
  primary: string;
  secondary: string;
  tertiary: string;
  scale: {
    primary: ColorScale;
    secondary: ColorScale;
    tertiary: ColorScale;
  };
}

export interface GenerateTriadicPaletteOptions {
  darkMode?: boolean;
  referenceHex?: string;
  minContrastRatio?: number;
}

const toOklch = converter("oklch");
const toRgb = converter("rgb");

function wrapHue(h: number): number {
  return ((h % 360) + 360) % 360;
}

function clampL(l: number): number {
  return Math.max(L_MIN, Math.min(L_MAX, l));
}

function ensureContrast(
  oklch: Oklch,
  referenceHex: string,
  minRatio: number
): Oklch {
  let current = { ...oklch };
  const refRgb = toRgb(referenceHex);
  if (!refRgb) return current;

  let ratio = wcagContrast(toRgb(current), refRgb);
  if (ratio >= minRatio) return current;

  const step = 0.02;
  for (let i = 0; i < 30; i++) {
    const darker = { ...current, l: Math.max(0.1, current.l - step) };
    const lighter = { ...current, l: Math.min(0.95, current.l + step) };
    const ratioD = wcagContrast(toRgb(darker), refRgb);
    const ratioL = wcagContrast(toRgb(lighter), refRgb);
    if (ratioD >= minRatio) {
      current = darker;
      ratio = ratioD;
      break;
    }
    if (ratioL >= minRatio) {
      current = lighter;
      ratio = ratioL;
      break;
    }
    current = ratioD > ratioL ? darker : lighter;
    ratio = Math.max(ratioD, ratioL);
  }
  return { ...current, l: clampL(current.l) };
}

function oklchToHex(oklch: Oklch): string {
  const rgb = toRgb(oklch);
  if (!rgb) return "#000000";
  return formatHex(rgb);
}

function buildColorScale(oklch: Oklch, darkMode: boolean): ColorScale {
  const { l: mainL, c, h } = oklch;
  const result = {} as ColorScale;
  for (const key of SCALE_KEYS) {
    const L = scaleLForKey(key, mainL, darkMode);
    const scaled: Oklch = { mode: "oklch", l: L, c, h };
    result[key] = oklchToHex(scaled);
  }
  return result;
}

export function generateTriadicPalette(
  hex?: string,
  options?: GenerateTriadicPaletteOptions
): TriadicPalette {
  const darkMode = options?.darkMode ?? false;
  const referenceHex =
    options?.referenceHex ?? (darkMode ? "#0a0a0a" : "#ffffff");
  const minContrastRatio = options?.minContrastRatio ?? 4.5;

  const seedHex = hex?.trim() || DEFAULT_SEED_HEX;
  const parsed = parse(seedHex);
  if (!parsed) {
    throw new Error(`Invalid hex: ${seedHex}`);
  }

  const seedOklch = toOklch(parsed) as Oklch | undefined;
  if (!seedOklch || seedOklch.mode !== "oklch") {
    throw new Error("Failed to convert seed to OKLCH");
  }

  const l = clampL(seedOklch.l);
  const c = (seedOklch.c ?? 0) * CHROMA_DAMPEN;
  const h = wrapHue(seedOklch.h ?? 0);

  const hues: [number, number, number] = [
    h,
    wrapHue(h + HUE_OFFSET),
    wrapHue(h - HUE_OFFSET),
  ];

  const oklchTriad: Oklch[] = hues.map(hu => ({
    mode: "oklch" as const,
    l,
    c,
    h: hu,
  }));

  let triad = oklchTriad.map(ok =>
    minContrastRatio > 0
      ? ensureContrast(ok, referenceHex, minContrastRatio)
      : ok
  );

  if (darkMode) {
    triad = triad.map(ok => ({
      ...ok,
      l: clampL(1 - ok.l),
    }));
    triad = triad.map(ok =>
      minContrastRatio > 0
        ? ensureContrast(ok, referenceHex, minContrastRatio)
        : ok
    );
  }

  const [primaryOklch, secondaryOklch, tertiaryOklch] = triad;

  return {
    primary: oklchToHex(primaryOklch),
    secondary: oklchToHex(secondaryOklch),
    tertiary: oklchToHex(tertiaryOklch),
    scale: {
      primary: buildColorScale(primaryOklch, darkMode),
      secondary: buildColorScale(secondaryOklch, darkMode),
      tertiary: buildColorScale(tertiaryOklch, darkMode),
    },
  };
}

/** 화이트 모드 기준 밝은/어두운 계열 랜덤 시드 HEX 생성 */
export function getRandomSeedHex(tone: "light" | "dark"): string {
  const h = Math.random() * 360;
  const c = 0.05 + Math.random() * 0.15;
  const l =
    tone === "light" ? 0.55 + Math.random() * 0.3 : 0.15 + Math.random() * 0.25;
  const oklch: Oklch = { mode: "oklch", l, c, h };
  return oklchToHex(oklch);
}
