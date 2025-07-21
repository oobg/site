import { create } from "zustand";

interface VisitedState {
  visitedPages: Set<string>;
  addVisited: (path: string) => void;
}

export const useVisitedStore = create<VisitedState>((set) => ({
  visitedPages: new Set(),
  addVisited: (path) =>
    set((state) => {
      const newSet = new Set(state.visitedPages);
      newSet.add(path);
      return { visitedPages: newSet };
    }),
}));
