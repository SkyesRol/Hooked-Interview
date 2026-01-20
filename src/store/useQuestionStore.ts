import { create } from "zustand";
import { db, type QuestionItem } from "@/lib/db";

export type QuestionState = {
    getRandomQuestionByTopic: (topic: string) => Promise<QuestionItem | null>;
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
        return db.questions.where("topic").equals(topic).count();
    },
    getRandomQuestionByTopic: async (topic) => {
        if (!topic) return null;
        const list = await db.questions.where("topic").equals(topic).toArray();
        if (list.length === 0) return null;
        return list[Math.floor(Math.random() * list.length)];
    },
}));

