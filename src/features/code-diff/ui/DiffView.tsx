import { Fragment } from "react";

import { cn } from "@/shared/lib/utils";

import type { LineChange } from "../lib/diff";

type DiffViewProps = {
  changes: LineChange[];
  mode: "unified" | "side-by-side";
  className?: string;
};

const addedBg = "bg-green-500/15 dark:bg-green-500/20";
const removedBg = "bg-red-500/15 dark:bg-red-500/20";

/** 한 페이지/두 페이지 공통: 라인 높이 1.7rem, flex 상하 중앙 정렬 */
const lineRowClass = "min-h-[1.7rem] items-center";

/** 두 페이지 전용: 행 높이 고정(양쪽 컬럼 정렬 맞춤) */
const sideBySideRowClass = "h-[1.7rem] items-center";

function UnifiedDiff({
  changes,
  className,
}: {
  changes: LineChange[];
  className?: string;
}) {
  let lNum = 0;
  let rNum = 0;
  const rows: {
    line: string;
    prefix: string;
    isAdded: boolean;
    isRemoved: boolean;
    lineNo: number | null;
  }[] = [];
  for (const c of changes) {
    const lines = splitLines(c.value);
    const isAdded = !!c.added;
    const isRemoved = !!c.removed;
    const prefix = isAdded ? "+ " : isRemoved ? "- " : "  ";
    for (const line of lines) {
      const lastDisplayNo =
        rows.length > 0 ? rows[rows.length - 1].lineNo : null;
      if (isAdded) {
        rNum += 1;
        const hide = lastDisplayNo === rNum;
        rows.push({
          line,
          prefix,
          isAdded,
          isRemoved,
          lineNo: hide ? null : rNum,
        });
      } else if (isRemoved) {
        lNum += 1;
        const hide = lastDisplayNo === lNum;
        rows.push({
          line,
          prefix,
          isAdded,
          isRemoved,
          lineNo: hide ? null : lNum,
        });
      } else {
        lNum += 1;
        rNum += 1;
        const hide = lastDisplayNo === lNum;
        rows.push({
          line,
          prefix,
          isAdded,
          isRemoved,
          lineNo: hide ? null : lNum,
        });
      }
    }
  }
  return (
    <pre
      className={cn(
        "overflow-auto rounded-md border border-border bg-muted/20 p-3 font-mono text-sm leading-relaxed",
        className
      )}
    >
      <code className="block min-h-[8rem]">
        {rows.map((row, key) => (
          <div
            key={key}
            className={cn(
              "flex gap-2",
              lineRowClass,
              row.isAdded && addedBg,
              row.isRemoved && removedBg
            )}
          >
            <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
              {row.lineNo ?? ""}
            </span>
            <span
              className={cn(
                row.isAdded && "text-green-700 dark:text-green-400",
                row.isRemoved && "text-red-700 dark:text-red-400"
              )}
            >
              {row.prefix}
              {row.line || " "}
            </span>
          </div>
        ))}
      </code>
    </pre>
  );
}

/** diff 라이브러리와 동일하게 라인 분리. 후행/선행 빈 줄 제거(여러 개도 제거). */
function splitLines(value: string): string[] {
  const lines = value.split(/\r?\n/);
  while (lines.length && lines[lines.length - 1] === "") lines.pop();
  while (lines.length > 1 && lines[0] === "") lines.shift();
  return lines;
}

type SideLine = {
  text: string;
  kind: "same" | "removed" | "added";
  lineNo?: number;
};

/** 한 행: 왼쪽(원본)/오른쪽(수정본) 내용. null이면 해당 쪽만 있는 행(추가 또는 삭제). */
type RawRow = {
  left: string | null;
  right: string | null;
  leftNo?: number;
  rightNo?: number;
};

/**
 * 1) changes를 순서대로 풀어서 RawRow[] 생성 (왼쪽/오른쪽 줄 번호 부여).
 * 2) 연속된 "왼쪽만 / 오른쪽만" 행들을 짝지어 (removed, added) 한 행으로 병합.
 *    → 같은 텍스트가 여러 줄이어도, 청크 순서와 무관하게 원본 줄 번호가 맞게 됨.
 */
function buildSideBySideRows(changes: LineChange[]): {
  left: SideLine[];
  right: SideLine[];
} {
  const rawRows: RawRow[] = [];
  let lNum = 0;
  let rNum = 0;
  for (const c of changes) {
    const lines = splitLines(c.value);
    for (const line of lines) {
      if (c.added) {
        rawRows.push({ left: null, right: line, rightNo: ++rNum });
      } else if (c.removed) {
        rawRows.push({ left: line, right: null, leftNo: ++lNum });
      } else {
        rawRows.push({
          left: line,
          right: line,
          leftNo: ++lNum,
          rightNo: ++rNum,
        });
      }
    }
  }

  const left: SideLine[] = [];
  const right: SideLine[] = [];
  let i = 0;
  while (i < rawRows.length) {
    const row = rawRows[i];
    if (row.left !== null && row.right !== null) {
      left.push({ text: row.left, kind: "same", lineNo: row.leftNo });
      right.push({ text: row.right, kind: "same", lineNo: row.rightNo });
      i += 1;
      continue;
    }
    const leftOnly: RawRow[] = [];
    const rightOnly: RawRow[] = [];
    while (i < rawRows.length) {
      const r = rawRows[i];
      if (r.left !== null && r.right !== null) break;
      if (r.left !== null && r.right === null) leftOnly.push(r);
      if (r.left === null && r.right !== null) rightOnly.push(r);
      i += 1;
    }
    const pairCount = Math.max(leftOnly.length, rightOnly.length, 1);
    for (let k = 0; k < pairCount; k++) {
      const lo = leftOnly[k];
      const ro = rightOnly[k];
      left.push(
        lo
          ? { text: lo.left!, kind: "removed", lineNo: lo.leftNo }
          : { text: "", kind: "same" }
      );
      right.push(
        ro
          ? { text: ro.right!, kind: "added", lineNo: ro.rightNo }
          : { text: "", kind: "same" }
      );
    }
  }
  return { left, right };
}

function SideBySideDiff({
  changes,
  className,
}: {
  changes: LineChange[];
  className?: string;
}) {
  const { left, right } = buildSideBySideRows(changes);
  return (
    <div
      className={cn(
        "grid min-h-[8rem] overflow-auto rounded-md border border-border bg-muted/20 font-mono text-sm leading-relaxed",
        "auto-rows-[1.7rem] grid-cols-2",
        className
      )}
    >
      {left.map((item, i) => {
        const isLastRow = i === left.length - 1;
        const rowBorderClass = isLastRow ? "" : "border-b border-border/50";
        return (
          <Fragment key={i}>
            <div
              className={cn(
                "flex overflow-hidden border-r border-border",
                rowBorderClass,
                sideBySideRowClass,
                item.kind === "removed" && removedBg,
                item.kind === "removed" && "text-red-700 dark:text-red-400"
              )}
            >
              <span className="w-8 shrink-0 pr-2 text-right text-xs text-muted-foreground">
                {item.lineNo ?? ""}
              </span>
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap pl-2">
                {item.text || " "}
              </code>
            </div>
            <div
              className={cn(
                "flex overflow-hidden",
                rowBorderClass,
                sideBySideRowClass,
                right[i].kind === "added" && addedBg,
                right[i].kind === "added" &&
                  "text-green-700 dark:text-green-400"
              )}
            >
              <span className="w-8 shrink-0 pr-2 text-right text-xs text-muted-foreground">
                {right[i].lineNo ?? ""}
              </span>
              <code className="min-w-0 flex-1 overflow-x-auto whitespace-nowrap pl-2">
                {right[i].text || " "}
              </code>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}

export function DiffView({ changes, mode, className }: DiffViewProps) {
  if (mode === "unified") {
    return <UnifiedDiff changes={changes} className={className} />;
  }
  return <SideBySideDiff changes={changes} className={className} />;
}
