import Dexie, { type Table } from "dexie";

export type Difficulty = "Simple" | "Medium" | "Hard";

export type QuestionType = "Coding" | "Concept" | "Design" | "Scenario";

export type QuestionItem = {
  id: string;
  contentHash: string;
  topic: string;
  content: string;
  questionType?: QuestionType;
  difficulty: Difficulty;
  source: "user-import" | "ai-saved";
  tags?: string[];
  expectedPoints?: string[];
  relationships?: {
    prerequisites?: string[];
    nextTopics?: string[];
    followUp?: {
      ifCorrect: string;
      ifWrong: string;
    };
  };
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
  sessionId?: string;
  blueprintId?: string;
  sourceType?: "AI" | "Local";
  questionId?: string;
  difficulty?: Difficulty;
  questionType?: string;
  questionContent: string;
  userAnswer: string;
  evaluation: InterviewEvaluation;
};

export type InterviewBlueprint = {
  id: string;
  name: string;
  strategy: {
    requiredDomains: Array<{
      topic: string;
      levelRange: [Difficulty, Difficulty];
      minQuestions: number;
    }>;
    electiveDomains: Array<{
      topic: string;
      weight: number;
      allowDeepDive: boolean;
    }>;
    redLines: string[];
    followUpStrategy?: {
      enabled?: boolean;
      remedial?: {
        triggerBelowScore: number;
        stopAtOrAboveScore: number;
        max: number;
      };
      deepen?: {
        triggerAtOrAboveScore: number;
        continueAtOrAboveScore: number;
        max: number;
      };
      focus?: {
        includeWeakestDimension: boolean;
        includeTechTags: boolean;
      };
    };
  };
};

export type InterviewSession = {
  id: string;
  blueprintId: string;
  candidateName: string;
  startTime: number;
  status: "active" | "completed";
  currentPhase: "foundation" | "deep-dive" | "algo";
  selectedFrameworks: string[];
  history: Array<{
    recordId: string;
    questionId: string;
    topic: string;
    difficulty: Difficulty;
    questionType: QuestionType;
    score: number;
    timestamp: number;
    kind?: "main" | "follow-up";
    rootRecordId?: string;
  }>;
  domainScores: Record<string, number>;
  pendingFollowUp?: {
    rootRecordId: string;
    lastRecordId: string;
    topic: string;
    phase: "foundation" | "deep-dive";
    mode: "remedial" | "deepen";
    asked: number;
    max: number;
  };
};

class FrontendInterviewDB extends Dexie {
  questions!: Table<QuestionItem, string>;
  records!: Table<InterviewRecord, string>;
  blueprints!: Table<InterviewBlueprint, string>;
  sessions!: Table<InterviewSession, string>;

  constructor() {
    super("frontend-interview-ai");
    this.version(1).stores({
      questions: "id, contentHash, topic, difficulty, createdAt",
      records: "id, timestamp, topic",
    });
    this.version(2).stores({
      questions: "id, contentHash, topic, difficulty, createdAt",
      records: "id, timestamp, topic",
    });
    this.version(3).stores({
      questions: "id, contentHash, topic, difficulty, questionType, createdAt",
      records: "id, timestamp, topic",
      blueprints: "id, name",
      sessions: "id, blueprintId, startTime, status",
    });
    this.version(4).stores({
      questions: "id, contentHash, topic, difficulty, questionType, createdAt",
      records: "id, timestamp, topic, sessionId, blueprintId",
      blueprints: "id, name",
      sessions: "id, blueprintId, startTime, status",
    });
  }
}

export const db = new FrontendInterviewDB();
