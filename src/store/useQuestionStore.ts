import { create } from "zustand";
import { db, type QuestionItem } from "@/lib/db";
import { resolveTech } from "@/constants/topics";

export type QuestionState = {
    getRandomQuestionByTopic: (topic: string, excludeId?: string) => Promise<QuestionItem | null>;
    hasAnyQuestions: () => Promise<boolean>;
    countByTopic: (topic: string) => Promise<number>;
};

export const useQuestionStore = create<QuestionState>(() => ({
    hasAnyQuestions: async () => {
        const count = await db.questions.count();
        return count > 0;
    },
    countByTopic: async (topic) => {
        if (!topic) return 0;
        const resolved = resolveTech(topic);
        if (!resolved) return db.questions.where("topic").equals(topic).count();
        return db.questions.where("topic").anyOf([resolved.slug, resolved.label]).count();
    },
    getRandomQuestionByTopic: async (topic, excludeId) => {
        if (!topic) return null;
        const resolved = resolveTech(topic);
        const list = resolved
            ? await db.questions.where("topic").anyOf([resolved.slug, resolved.label]).toArray()
            : await db.questions.where("topic").equals(topic).toArray();

        // If we want to exclude a specific ID (e.g. current question)
        const candidates = excludeId
            ? list.filter(q => q.id !== excludeId)
            : list;

        // If candidates are empty but original list wasn't (meaning only 1 question exists),
        // we might have to return the original one or return null.
        // Returning null allows the UI to say "No more questions".
        // But for better UX, if there is only 1 question, maybe we just return it?
        // Let's return from candidates if possible, else from list.
        const pool = candidates.length > 0 ? candidates : list;

        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    },
}));

