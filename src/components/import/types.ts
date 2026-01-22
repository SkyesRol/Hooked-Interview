import type { Difficulty, QuestionType } from "@/lib/db";

export type ImportSource = "manual" | "json";

export type RawInput = {
  topic: string;
  difficulty: string;
  questionType?: string;
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
    questionType: QuestionType;
    content: string;
    tags: string[];
  };
}
