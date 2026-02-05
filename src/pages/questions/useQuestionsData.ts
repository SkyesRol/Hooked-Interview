import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { normalizeTopicSlug, resolveTech } from "@/constants/topics";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useDexieLiveQuery } from "@/hooks/useDexieLiveQuery";
import { db, type Difficulty, type QuestionItem } from "@/lib/db";

export function useQuestionsRepositoryQuery({
    searchQuery,
    selectedTopics,
    difficultyFilter,
    page,
    pageSize,
    setPage,
}: {
    searchQuery: string;
    selectedTopics: string[];
    difficultyFilter: "All" | Difficulty;
    page: number;
    pageSize: number;
    setPage: (page: number) => void;
}) {
    const debouncedQuery = useDebouncedValue(searchQuery, 300);
    const normalizedQuery = debouncedQuery.trim().toLowerCase();

    const topicsFactory = useCallback(async () => {
        const keys = await db.questions.orderBy("topic").uniqueKeys();
        const unique = new Set<string>();
        const output: string[] = [];
        for (const k of keys) {
            const raw = typeof k === "string" ? k.trim() : "";
            if (!raw) continue;
            const normalized = normalizeTopicSlug(raw);
            if (!normalized) continue;
            if (unique.has(normalized)) continue;
            unique.add(normalized);
            output.push(normalized);
        }
        return output;
    }, []);

    const listFactory = useCallback(async () => {
        const offset = Math.max(0, (page - 1) * pageSize);
        const selectedSet = new Set(selectedTopics.map((t) => normalizeTopicSlug(t)));

        const filtered = db.questions
            .orderBy("createdAt")
            .reverse()
            .filter((q) => {
                if (difficultyFilter !== "All" && q.difficulty !== difficultyFilter) return false;
                const topicSlug = normalizeTopicSlug(q.topic ?? "");
                if (selectedSet.size && !selectedSet.has(topicSlug)) return false;
                if (!normalizedQuery) return true;
                const topicLabel = q.topic ? resolveTech(q.topic)?.label ?? "" : "";
                const hay = `${topicSlug} ${topicLabel} ${q.topic ?? ""} ${q.content}`.toLowerCase();
                return hay.includes(normalizedQuery);
            });

        const total = await filtered.count();
        const items = await filtered.offset(offset).limit(pageSize).toArray();
        return { total, items };
    }, [difficultyFilter, normalizedQuery, page, pageSize, selectedTopics]);

    const { data: topics, loading: topicsLoading } = useDexieLiveQuery(topicsFactory, [] as string[]);
    const { data: queryResult, loading: listLoading, error: listError } = useDexieLiveQuery(listFactory, {
        total: 0,
        items: [] as QuestionItem[],
    });

    const totalPages = useMemo(() => Math.max(1, Math.ceil(queryResult.total / pageSize)), [pageSize, queryResult.total]);
    const canPrev = page > 1;
    const canNext = page < totalPages;

    useEffect(() => {
        if (page > totalPages) setPage(totalPages);
    }, [page, setPage, totalPages]);

    const anyFilters = Boolean(searchQuery.trim() || selectedTopics.length || difficultyFilter !== "All");

    return {
        topics,
        topicsLoading,
        queryResult,
        listLoading,
        listError,
        totalPages,
        canPrev,
        canNext,
        anyFilters,
    };
}

type ExportMode = "full" | "lite" | "custom";
type ExportField =
    | "id"
    | "topic"
    | "content"
    | "questionType"
    | "difficulty"
    | "source"
    | "tags"
    | "expectedPoints"
    | "relationships"
    | "createdAt"
    | "contentHash";

export const EXPORT_FIELD_OPTIONS: Array<{ key: ExportField; label: string; hint: string }> = [
    { key: "topic", label: "Topic", hint: "题目所属主题" },
    { key: "content", label: "Content", hint: "题目正文" },
    { key: "questionType", label: "Question Type", hint: "题型（Coding/Concept/…）" },
    { key: "difficulty", label: "Difficulty", hint: "难度（Simple/Medium/Hard）" },
    { key: "tags", label: "Tags", hint: "标签数组" },
    { key: "source", label: "Source", hint: "来源（user-import/ai-saved）" },
    { key: "expectedPoints", label: "Expected Points", hint: "考点提示" },
    { key: "relationships", label: "Relationships", hint: "知识关联结构" },
    { key: "id", label: "ID", hint: "本地唯一标识" },
    { key: "contentHash", label: "Content Hash", hint: "去重用哈希" },
    { key: "createdAt", label: "Created At", hint: "创建时间戳" },
];

export const LITE_FIELDS: ExportField[] = ["topic", "content", "questionType", "difficulty", "tags"];

export const FULL_FIELDS: ExportField[] = [
    "id",
    "contentHash",
    "topic",
    "content",
    "questionType",
    "difficulty",
    "source",
    "tags",
    "expectedPoints",
    "relationships",
    "createdAt",
];

export function useQuestionsExport() {
    const [isExporting, setIsExporting] = useState(false);
    const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
    const exportMenuRef = useRef<HTMLDivElement | null>(null);
    const [isCustomExportOpen, setIsCustomExportOpen] = useState(false);
    const exportCancelRef = useRef<HTMLButtonElement | null>(null);

    const [customExportFields, setCustomExportFields] = useState<Record<ExportField, boolean>>(() => {
        const initial = {} as Record<ExportField, boolean>;
        for (const { key } of EXPORT_FIELD_OPTIONS) initial[key] = false;
        for (const key of LITE_FIELDS) initial[key] = true;
        return initial;
    });

    const selectedCustomFields = useMemo(() => {
        const keys: ExportField[] = [];
        for (const { key } of EXPORT_FIELD_OPTIONS) {
            if (customExportFields[key]) keys.push(key);
        }
        return keys;
    }, [customExportFields]);

    useEffect(() => {
        if (!isExportMenuOpen) return;

        const handlePointerDown = (e: PointerEvent) => {
            const target = e.target;
            if (!(target instanceof Node)) return;
            if (!exportMenuRef.current) return;
            if (exportMenuRef.current.contains(target)) return;
            setIsExportMenuOpen(false);
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsExportMenuOpen(false);
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, [isExportMenuOpen]);

    useEffect(() => {
        if (!isCustomExportOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setIsCustomExportOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isCustomExportOpen]);

    useEffect(() => {
        if (!isCustomExportOpen) return;
        exportCancelRef.current?.focus();
    }, [isCustomExportOpen]);

    const handleExportAllQuestions = useCallback(
        async (mode: ExportMode, fields?: ExportField[]) => {
            if (isExporting) return;
            setIsExporting(true);
            try {
                const questions = await db.questions.orderBy("createdAt").toArray();
                const exportedAt = new Date().toISOString();
                const stamp = exportedAt.replace(/[:.]/g, "-");
                const filenameSuffix = mode === "full" ? "full" : mode === "lite" ? "lite" : "custom";

                const resolveFieldValue = (q: QuestionItem, field: ExportField) => {
                    if (field === "tags") return q.tags ?? [];
                    if (field === "questionType") return q.questionType ?? null;
                    if (field === "expectedPoints") return q.expectedPoints ?? [];
                    if (field === "relationships") return q.relationships ?? null;
                    return q[field];
                };

                const pickFields = (q: QuestionItem, keys: ExportField[]) => {
                    const out: Record<string, unknown> = {};
                    for (const key of keys) out[key] = resolveFieldValue(q, key);
                    return out;
                };

                const exportQuestions = (() => {
                    if (mode === "full") return questions;
                    if (mode === "lite") return questions.map((q) => pickFields(q, LITE_FIELDS));
                    const keys = fields?.length ? fields : LITE_FIELDS;
                    return questions.map((q) => pickFields(q, keys));
                })();

                const payload: Record<string, unknown> = {
                    exportedAt,
                    mode,
                    questions: exportQuestions,
                };
                if (mode === "custom") payload.fields = fields?.length ? fields : LITE_FIELDS;
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
                const url = URL.createObjectURL(blob);

                const a = document.createElement("a");
                a.href = url;
                a.download = `questions-export-${filenameSuffix}-${stamp}.json`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.setTimeout(() => URL.revokeObjectURL(url), 0);
                toast.success(`已导出 ${questions.length} 道题`);
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err);
                toast.error(`导出失败: ${message}`);
            } finally {
                setIsExporting(false);
            }
        },
        [isExporting],
    );

    return {
        isExporting,
        isExportMenuOpen,
        setIsExportMenuOpen,
        exportMenuRef,
        isCustomExportOpen,
        setIsCustomExportOpen,
        exportCancelRef,
        customExportFields,
        setCustomExportFields,
        selectedCustomFields,
        handleExportAllQuestions,
    };
}

