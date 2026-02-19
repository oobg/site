import { useCallback } from "react";

export function useContactFeedback() {
  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  return { copyToClipboard };
}
