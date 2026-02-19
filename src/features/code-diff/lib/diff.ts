import { diffLines } from "diff";

export type LineChange = {
  value: string;
  added?: boolean;
  removed?: boolean;
};

/**
 * 라인 단위 diff. unified 뷰와 side-by-side 뷰 모두에서 사용.
 */
export function computeLineDiff(original: string, modified: string): LineChange[] {
  const changes = diffLines(original, modified);
  return changes.map((c) => ({
    value: c.value,
    ...(c.added && { added: true }),
    ...(c.removed && { removed: true }),
  }));
}
