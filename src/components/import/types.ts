import type { Difficulty } from "@/lib/db";

export type ImportSource = "manual" | "json";

export type RawInput = {
  topic: string;
  difficulty: string;
  content: string;
  tags?: string[];
  source: ImportSource;
};

export type ExistingQuestion = {
  topic: string;
  content: string;
};

export interface StagedItem {
  _tempId: string;
  status: "valid" | "duplicate" | "error";
  errorMsg?: string;
  source: ImportSource;
  payload: {
    topic: string;
    difficulty: Difficulty;
    content: string;
    tags: string[];
  };
}

