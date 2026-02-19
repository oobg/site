import { cn } from "@/shared/lib/utils";

const textareaClass =
  "min-h-[12rem] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

type OriginalModifiedInputsProps = {
  original: string;
  modified: string;
  onOriginalChange: (value: string) => void;
  onModifiedChange: (value: string) => void;
  className?: string;
};

export function OriginalModifiedInputs({
  original,
  modified,
  onOriginalChange,
  onModifiedChange,
  className,
}: OriginalModifiedInputsProps) {
  return (
    <div className={cn("grid gap-4 sm:grid-cols-2", className)}>
      <div className="space-y-2">
        <label htmlFor="diff-original" className="text-sm font-medium">
          원본
        </label>
        <textarea
          id="diff-original"
          value={original}
          onChange={(e) => onOriginalChange(e.target.value)}
          className={textareaClass}
          placeholder="원본 텍스트를 입력하세요"
          spellCheck={false}
        />
      </div>
      <div className="space-y-2">
        <label htmlFor="diff-modified" className="text-sm font-medium">
          수정본
        </label>
        <textarea
          id="diff-modified"
          value={modified}
          onChange={(e) => onModifiedChange(e.target.value)}
          className={textareaClass}
          placeholder="수정된 텍스트를 입력하세요"
          spellCheck={false}
        />
      </div>
    </div>
  );
}
