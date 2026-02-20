import { useEffect, useState } from "react";

import { fetchPostsList } from "./api";
import type { PostsListData } from "./schema";

export function usePostsList(skip: number, limit: number) {
  const [data, setData] = useState<PostsListData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setIsLoading(true);
    });
    fetchPostsList(skip, limit)
      .then(res => {
        if (!cancelled) {
          setData(res);
          setError(null);
        }
      })
      .catch(e => {
        if (!cancelled) setError(e);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [skip, limit]);

  return { data, isLoading, error };
}
