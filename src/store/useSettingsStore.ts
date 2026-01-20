import { create } from "zustand";
import { persist } from "zustand/middleware";
import { normalizeBaseUrl } from "@/lib/ai/normalizeBaseUrl";

export type SettingsState = {
  apiKey: string;
  baseUrl: string;
  model: string;
  setSettings: (settings: Partial<Omit<SettingsState, "setSettings">>) => void;
};

const storageKey = "frontend-interview-settings";

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-3.5-turbo",
      setSettings: (settings) =>
        set((state) => ({
          ...state,
          ...settings,
          baseUrl: settings.baseUrl ? normalizeBaseUrl(settings.baseUrl) : state.baseUrl,
        })),
    }),
    {
      name: storageKey,
      partialize: (state) => ({
        apiKey: state.apiKey,
        baseUrl: state.baseUrl,
        model: state.model,
      }),
    },
  ),
);
