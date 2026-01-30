import { create } from "zustand";
import type { Difficulty } from "@/lib/db";

export type ViewMode = "grid" | "list";

export type QuestionListState = {
  searchQuery: string;
  selectedTopics: string[];
  difficultyFilter: Difficulty | "All";
  viewMode: ViewMode;
  page: number;
  pageSize: number;
  setSearchQuery: (query: string) => void;
  toggleTopic: (topic: string) => void;
  setDifficulty: (diff: Difficulty | "All") => void;
  setViewMode: (mode: ViewMode) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  resetFilters: () => void;
};

export const useQuestionListStore = create<QuestionListState>((set) => ({
  searchQuery: "",
  selectedTopics: [],
  difficultyFilter: "All",
  viewMode: "grid",
  page: 1,
  pageSize: 18,
  setSearchQuery: (query) => set(() => ({ searchQuery: query, page: 1 })),
  toggleTopic: (topic) =>
    set((state) => {
      const exists = state.selectedTopics.includes(topic);
      const selectedTopics = exists
        ? state.selectedTopics.filter((t) => t !== topic)
        : [...state.selectedTopics, topic];
      return { selectedTopics, page: 1 };
    }),
  setDifficulty: (diff) => set(() => ({ difficultyFilter: diff, page: 1 })),
  setViewMode: (mode) => set(() => ({ viewMode: mode })),
  setPage: (page) => set(() => ({ page: Math.max(1, Math.floor(page) || 1) })),
  setPageSize: (size) =>
    set(() => ({ pageSize: Math.max(6, Math.floor(size) || 18), page: 1 })),
  resetFilters: () =>
    set(() => ({
      searchQuery: "",
      selectedTopics: [],
      difficultyFilter: "All",
      page: 1,
    })),
}));
