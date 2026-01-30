import { useCallback, useMemo, useState } from "react";
import { Database, FileJson, PenTool, Plus, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ManualEntryForm from "@/components/import/ManualEntryForm";
import JsonPaste from "@/components/import/JsonPaste";
import StagingList from "@/components/import/StagingList";
import type { RawInput, StagedItem } from "@/components/import/types";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";
import type { QuestionItem } from "@/lib/db";
import { cn } from "@/lib/utils";
import { computeContentHash, validateAndCheckDuplicates } from "@/services/importValidation";

type ImportMode = "manual" | "json";

export default function Import() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<ImportMode>("manual");
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [isCommitting, setIsCommitting] = useState(false);

  const validCount = useMemo(() => stagedItems.filter((i) => i.status === "valid").length, [stagedItems]);

  const stageRawItems = useCallback(
    async (rawItems: RawInput[]) => {
      if (!rawItems.length) return;

      const topics = Array.from(new Set(rawItems.map((r) => r.topic).filter(Boolean)));
      const existingByTopic = await Promise.all(
        topics.map((t) => db.questions.where("topic").equals(t.trim()).toArray()),
      );
      const existingFromDb = existingByTopic.flat().map((q) => ({ topic: q.topic, content: q.content }));
      const existingFromStaging = stagedItems.map((s) => ({ topic: s.payload.topic, content: s.payload.content }));
      const staged = await validateAndCheckDuplicates(rawItems, [...existingFromDb, ...existingFromStaging]);

      setStagedItems((prev) => [...staged, ...prev]);
    },
    [stagedItems],
  );

  const forceAdd = useCallback((tempId: string) => {
    setStagedItems((prev) =>
      prev.map((item) => (item._tempId === tempId && item.status === "duplicate" ? { ...item, status: "valid" } : item)),
    );
  }, []);

  const removeItem = useCallback((tempId: string) => {
    setStagedItems((prev) => prev.filter((i) => i._tempId !== tempId));
  }, []);

  const commit = useCallback(async () => {
    const items = stagedItems.filter((i) => i.status === "valid");
    if (!items.length) return;

    setIsCommitting(true);
    try {
      const now = Date.now();
      const toInsert: QuestionItem[] = await Promise.all(
        items.map(async (s) => {
          const normalizedContent = s.payload.content.trim();
          const contentHash = await computeContentHash(s.payload.topic, normalizedContent);
          return {
            id: crypto.randomUUID(),
            contentHash,
            topic: s.payload.topic,
            content: normalizedContent,
            questionType: s.payload.questionType,
            difficulty: s.payload.difficulty,
            source: "user-import",
            tags: s.payload.tags.length ? s.payload.tags : undefined,
            createdAt: now,
          };
        }),
      );

      await db.questions.bulkAdd(toInsert);
      toast.success(`Successfully imported ${toInsert.length} questions`);
      setStagedItems((prev) => prev.filter((i) => i.status !== "valid"));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`Import failed: ${message}`);
      console.error(err);
    } finally {
      setIsCommitting(false);
    }
  }, [stagedItems]);

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 pb-3 pt-4">
        {/* Navigation Bar */}
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="flex items-center gap-2 font-heading text-xl font-bold italic transition-colors hover:text-gold"
            >
              <PenTool className="h-4 w-4 text-gold" aria-hidden="true" />
              Frontend Playground
            </button>
            <div className="hidden items-center gap-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light md:flex">
              <button type="button" onClick={() => navigate("/")} className="transition-colors hover:text-ink">
                PRACTICE
              </button>
              <button type="button" onClick={() => navigate("/history")} className="transition-colors hover:text-ink">
                HISTORY
              </button>
              <button type="button" className="text-ink font-bold">
                IMPORT QUESTIONS
              </button>
            </div>
          </div>
        </nav>

        {/* Page Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold">
              Import <span className="text-gold italic">Questions</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-light text-ink-light">
              Add new questions to your local database. Input → Preview → Save.
            </p>
          </div>
          <Button
            type="button"
            onClick={commit}
            disabled={!validCount || isCommitting}
            className="h-10 border-sketch bg-ink px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-gold hover:text-ink disabled:opacity-50"
          >
            <Save className="mr-2 h-4 w-4" />
            Save to Database ({validCount})
          </Button>
        </div>

        {/* Input Section */}
        <div className="mb-8 space-y-6">
          <div className="flex flex-col overflow-hidden border-sketch bg-white">
            <div className="flex items-center justify-between border-b border-ink/10 bg-slate-50/30 px-6 py-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-ink">Input Source</h3>
                <p className="text-xs text-ink-light">Choose manual entry or bulk JSON import</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setMode("manual")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                    mode === "manual" ? "bg-white text-ink shadow-sm" : "text-ink-light hover:text-ink"
                  )}
                >
                  <Plus className="h-3.5 w-3.5" />
                  Manual
                </button>
                <button
                  type="button"
                  onClick={() => setMode("json")}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all",
                    mode === "json" ? "bg-white text-ink shadow-sm" : "text-ink-light hover:text-ink"
                  )}
                >
                  <FileJson className="h-3.5 w-3.5" />
                  JSON Batch
                </button>
              </div>
            </div>
            <div className="p-6">
              {mode === "manual" ? <ManualEntryForm onStage={stageRawItems} /> : <JsonPaste onStage={stageRawItems} />}
            </div>
          </div>
        </div>

        {/* Staging Area */}
        <div className="mb-12 flex-1">
          <div className="flex flex-col overflow-hidden border-sketch bg-white min-h-[400px]">
            <div className="flex items-center justify-between border-b border-ink/10 bg-slate-50/30 px-6 py-4">
              <div>
                <h3 className="font-heading text-lg font-bold text-ink">Staging Area</h3>
                <p className="text-xs text-ink-light">Review items before saving. Duplicates can be forced.</p>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-ink-light" />
                <span className="text-xs font-bold text-ink">{stagedItems.length} Items</span>
              </div>
            </div>
            <div className="flex-1 bg-slate-50/20 p-6">
              <StagingList items={stagedItems} onForceAdd={forceAdd} onRemove={removeItem} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
