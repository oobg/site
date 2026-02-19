declare module "culori" {
  export interface Oklch {
    mode: "oklch";
    l: number;
    c: number;
    h: number;
    alpha?: number;
  }

  export type Rgb = { mode: "rgb"; r: number; g: number; b: number };
  export type Color = Oklch | Rgb | { mode: string; [k: string]: unknown };

  export function parse(color: string): Color | undefined;
  export function converter(
    mode: "oklch" | "rgb"
  ): (color: Color | string) => Oklch | Rgb | undefined;
  export function formatHex(color: Color | string): string;
  export function wcagContrast(
    a: Color | undefined,
    b: Color | undefined
  ): number;
}
