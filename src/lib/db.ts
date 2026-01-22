import Dexie, { type Table } from "dexie";

export type Difficulty = "Simple" | "Medium" | "Hard";

export type QuestionType = "Code" | "Theory" | "SystemDesign";

export type QuestionItem = {
  id: string;
  contentHash: string;
  topic: string;
  content: string;
  questionType?: QuestionType;
  difficulty: Difficulty;
  source: "user-import" | "ai-saved";
  tags?: string[];
  createdAt: number;
};

export type EvaluationDimensions = {
  accuracy: number;
  completeness: number;
  logic: number;
  codeQuality: number;
};

export type InterviewEvaluation = {
  score: number;
  techTags: string[];
  dimensions: EvaluationDimensions;
  comment: string;
  referenceAnswer: string;
};

export type InterviewRecord = {
  id: string;
  timestamp: number;
  topic: string;
  sourceType?: "AI" | "Local";
  questionId?: string;
  difficulty?: Difficulty;
  questionType?: string;
  questionContent: string;
  userAnswer: string;
  evaluation: InterviewEvaluation;
};

class FrontendInterviewDB extends Dexie {
  questions!: Table<QuestionItem, string>;
  records!: Table<InterviewRecord, string>;

  constructor() {
    super("frontend-interview-ai");
    this.version(1).stores({
      questions: "id, contentHash, topic, difficulty, createdAt",
      records: "id, timestamp, topic",
    });
  }
}

export const db = new FrontendInterviewDB();
