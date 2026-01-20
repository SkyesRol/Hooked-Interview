import { useCallback, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ManualEntryForm from "@/components/import/ManualEntryForm";
import JsonPaste from "@/components/import/JsonPaste";
import StagingList from "@/components/import/StagingList";
import type { RawInput, StagedItem } from "@/components/import/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import type { QuestionItem } from "@/lib/db";
import { cn } from "@/lib/utils";
import { computeContentHash, validateAndCheckDuplicates } from "@/services/importValidation";

type ImportMode = "manual" | "json";

export default function Import() {
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
            difficulty: s.payload.difficulty,
            source: "user-import",
            tags: s.payload.tags.length ? s.payload.tags : undefined,
            createdAt: now,
          };
        }),
      );

      await db.questions.bulkAdd(toInsert);
      toast.success(`已写入 ${toInsert.length} 道题`);
      setStagedItems((prev) => prev.filter((i) => i.status !== "valid"));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`写入失败: ${message}`);
      console.error(err);
    } finally {
      setIsCommitting(false);
    }
  }, [stagedItems]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-wrap items-center gap-3">
          <Link
            to="/"
            className={cn(
              "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900",
              "transition-colors hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            返回
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">智能导入题库</h1>
            <p className="mt-1 text-sm text-slate-600">Input → Preview → Save。当前仅做精确去重（topic + content）。</p>
          </div>
          <Button type="button" onClick={commit} disabled={!validCount || isCommitting}>
            写入题库（{validCount}）
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>输入</CardTitle>
            <CardDescription>选择手动录入或粘贴 JSON 批量导入。</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setMode("manual")}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium",
                  mode === "manual" ? "border-slate-900 bg-slate-900 text-slate-50" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                Manual Entry
              </button>
              <button
                type="button"
                onClick={() => setMode("json")}
                className={cn(
                  "inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium",
                  mode === "json" ? "border-slate-900 bg-slate-900 text-slate-50" : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
                )}
              >
                JSON Batch
              </button>
            </div>

            {mode === "manual" ? <ManualEntryForm onStage={stageRawItems} /> : <JsonPaste onStage={stageRawItems} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>暂存区</CardTitle>
            <CardDescription>确认无误后写入 IndexedDB。Duplicate 可强制加入，Error 需修正后重试。</CardDescription>
          </CardHeader>
          <CardContent>
            <StagingList items={stagedItems} onForceAdd={forceAdd} onRemove={removeItem} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

