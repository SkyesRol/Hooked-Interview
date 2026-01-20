import { create } from "zustand";
import type { InterviewRecord } from "@/lib/db";
import { db } from "@/lib/db";

export type TopicStats = {
  count: number;
  avgScore: number;
  maxScore: number;
  lastTimestamp: number | null;
};

export type RecordState = {
  records: InterviewRecord[];
  isLoading: boolean;
  loadRecords: () => Promise<void>;
  addRecord: (record: InterviewRecord) => Promise<void>;
  removeRecord: (id: string) => Promise<void>;
  clearRecords: () => Promise<void>;
  getTopicStats: (topic: string) => TopicStats;
  getRadarData: () => { subject: string; score: number; fullMark: number }[];
  getGlobalStats: () => { totalQuestions: number; globalAverage: number };
};

const legacyStorageKey = "frontend-interview-records";

function safeScore(record: InterviewRecord) {
  const score = record.evaluation?.score;
  return typeof score === "number" && Number.isFinite(score) ? score : 0;
}

function createLegacyRecord(legacy: { id: string; topic: string; score: number; timestamp: number }): InterviewRecord {
  return {
    id: legacy.id,
    timestamp: legacy.timestamp,
    topic: legacy.topic,
    sourceType: undefined,
    questionId: undefined,
    questionContent: "",
    userAnswer: "",
    evaluation: {
      score: legacy.score,
      techTags: [],
      dimensions: { accuracy: 0, completeness: 0, logic: 0, codeQuality: 0 },
      comment: "",
      referenceAnswer: "",
    },
  };
}

async function migrateLegacyRecordsIfNeeded() {
  const existing = await db.records.limit(1).toArray();
  if (existing.length > 0) return;

  const raw = localStorage.getItem(legacyStorageKey);
  if (!raw) return;

  const parsed = JSON.parse(raw) as unknown;
  if (!parsed || typeof parsed !== "object") return;

  const legacyRecords = (parsed as { state?: { records?: unknown } }).state?.records;
  if (!Array.isArray(legacyRecords) || legacyRecords.length === 0) return;

  const normalized: InterviewRecord[] = [];
  for (const item of legacyRecords) {
    if (!item || typeof item !== "object") continue;
    const id = (item as { id?: unknown }).id;
    const topic = (item as { topic?: unknown }).topic;
    const score = (item as { score?: unknown }).score;
    const timestamp = (item as { timestamp?: unknown }).timestamp;
    if (typeof id !== "string" || typeof topic !== "string") continue;
    if (typeof score !== "number" || !Number.isFinite(score)) continue;
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp)) continue;
    normalized.push(createLegacyRecord({ id, topic, score, timestamp }));
  }

  if (normalized.length === 0) return;
  await db.records.bulkPut(normalized);
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  isLoading: false,
  loadRecords: async () => {
    set({ isLoading: true });
    try {
      await migrateLegacyRecordsIfNeeded();
      const records = await db.records.orderBy("timestamp").reverse().toArray();
      set({ records });
    } finally {
      set({ isLoading: false });
    }
  },
  addRecord: async (record) => {
    await db.records.put(record);
    const records = await db.records.orderBy("timestamp").reverse().toArray();
    set({ records });
  },
  removeRecord: async (id) => {
    await db.records.delete(id);
    set((s) => ({ records: s.records.filter((r) => r.id !== id) }));
  },
  clearRecords: async () => {
    await db.records.clear();
    set({ records: [] });
  },
  getTopicStats: (topic) => {
    const list = get().records.filter((r) => r.topic === topic);
    const count = list.length;
    if (count === 0) return { count: 0, avgScore: 0, maxScore: 0, lastTimestamp: null };
    const sum = list.reduce((acc, r) => acc + safeScore(r), 0);
    const maxScore = list.reduce((acc, r) => {
      const s = safeScore(r);
      return s > acc ? s : acc;
    }, 0);
    const lastTimestamp = list.reduce((acc, r) => (r.timestamp > acc ? r.timestamp : acc), 0);
    return { count, avgScore: Math.round(sum / count), maxScore, lastTimestamp };
  },
  getRadarData: () => {
    const records = get().records;
    const byTag = new Map<string, { sum: number; count: number }>();
    for (const r of records) {
      const tags = Array.isArray(r.evaluation?.techTags) ? r.evaluation.techTags : [];
      const score = safeScore(r);
      for (const rawTag of tags) {
        const tag = typeof rawTag === "string" ? rawTag.trim() : "";
        if (!tag) continue;
        const prev = byTag.get(tag);
        if (prev) byTag.set(tag, { sum: prev.sum + score, count: prev.count + 1 });
        else byTag.set(tag, { sum: score, count: 1 });
      }
    }

    const tagEntries = [...byTag.entries()]
      .map(([tag, v]) => ({ tag, avgScore: Math.round(v.sum / v.count), count: v.count }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.avgScore - a.avgScore))
      .slice(0, 8);

    if (tagEntries.length > 0) {
      return tagEntries.map((t) => ({ subject: t.tag, score: t.avgScore, fullMark: 100 }));
    }

    const subjects = ["Vue", "React", "TypeScript", "JavaScript", "CSS", "Node.js"];
    return subjects.map((subject) => {
      const { avgScore } = get().getTopicStats(subject);
      return { subject, score: avgScore, fullMark: 100 };
    });
  },
  getGlobalStats: () => {
    const list = get().records;
    const totalQuestions = list.length;
    if (totalQuestions === 0) return { totalQuestions: 0, globalAverage: 0 };
    const sum = list.reduce((acc, r) => acc + safeScore(r), 0);
    return { totalQuestions, globalAverage: Math.round(sum / totalQuestions) };
  },
}));
