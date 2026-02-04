import { ChevronDown, FileDown, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppHeader from "@/components/shared/AppHeader";
import { HistoryCard } from "@/components/history/HistoryCard";
import { Button } from "@/components/ui/button";
import { db, type InterviewRecord } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useRecordStore } from "@/store/useRecordStore";

function downloadJsonFile(filename: string, payload: unknown) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function History() {
  const navigate = useNavigate();
  const records = useRecordStore((s) => s.records);
  const isLoading = useRecordStore((s) => s.isLoading);
  const loadRecords = useRecordStore((s) => s.loadRecords);

  const [isExporting, setIsExporting] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    loadRecords().catch((err) => {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`加载记录失败: ${message}`);
    });
  }, [loadRecords]);

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

  const handleExportAllRecords = useCallback(async (mode: "full" | "lite") => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const list = await db.records.orderBy("timestamp").reverse().toArray();
      const exportedAt = new Date().toISOString();
      const stamp = exportedAt.replace(/[:.]/g, "-");
      const filenameSuffix = mode === "full" ? "full" : "lite";
      const recordsPayload =
        mode === "full"
          ? list
          : list.map((record) => ({
            difficulty: record.difficulty ?? null,
            questionContent: record.questionContent,
            userAnswer: record.userAnswer,
            evaluation: record.evaluation,
          }));

      downloadJsonFile(`history-export-${filenameSuffix}-${stamp}.json`, { exportedAt, mode, records: recordsPayload });
      toast.success(`已导出 ${list.length} 条记录`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`导出失败: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }, [isExporting]);

  const handleRefresh = useCallback(async () => {
    try {
      await loadRecords();
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`刷新失败: ${message}`);
    }
  }, [loadRecords]);

  const headerRight = (
    <>
      <div ref={exportMenuRef} className="relative">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isExporting}
          onClick={() => setIsExportMenuOpen((prev) => !prev)}
          className="h-9 border-sketch bg-white text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:text-gold disabled:opacity-50"
          aria-haspopup="menu"
          aria-expanded={isExportMenuOpen}
        >
          <FileDown className="mr-2 h-4 w-4" />
          {isExporting ? "EXPORTING..." : "EXPORT"}
          <ChevronDown className="ml-2 h-4 w-4 opacity-70" />
        </Button>
        {isExportMenuOpen ? (
          <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 border-sketch bg-white p-2 shadow-sketch-hover">
            <button
              type="button"
              role="menuitem"
              className="w-full border-b border-ink/10 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-slate-50"
              onClick={() => {
                setIsExportMenuOpen(false);
                void handleExportAllRecords("full");
              }}
              disabled={isExporting}
            >
              <div className="flex items-center justify-between">
                <span>完整版</span>
                <span className="text-ink-light">FULL</span>
              </div>
              <div className="mt-1 text-[11px] font-normal tracking-normal text-ink-light normal-case">
                导出全部字段，适合备份与复盘
              </div>
            </button>
            <button
              type="button"
              role="menuitem"
              className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-slate-50"
              onClick={() => {
                setIsExportMenuOpen(false);
                void handleExportAllRecords("lite");
              }}
              disabled={isExporting}
            >
              <div className="flex items-center justify-between">
                <span>精简版</span>
                <span className="text-ink-light">LITE</span>
              </div>
              <div className="mt-1 text-[11px] font-normal tracking-normal text-ink-light normal-case">
                仅导出 difficulty / questionContent / userAnswer / evaluation
              </div>
            </button>
          </div>
        ) : null}
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={handleRefresh}
        disabled={isLoading}
        className="h-9 w-9 border-sketch bg-white text-ink hover:text-gold disabled:opacity-50"
        aria-label="Refresh"
      >
        <RefreshCcw className={cn("h-4 w-4", isLoading && "animate-spin")} />
      </Button>
    </>
  );

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-6 pt-4">
        <AppHeader active="history" right={headerRight} />

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold">
              History <span className="text-gold italic">Archive</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-light text-ink-light">Review your previous answers, AI evaluations, and retry mistakes.</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={idx} className="border-sketch bg-white p-5 animate-pulse">
                <div className="h-5 w-40 rounded bg-slate-100" />
                <div className="mt-3 h-3 w-full rounded bg-slate-100" />
                <div className="mt-2 h-3 w-5/6 rounded bg-slate-100" />
                <div className="mt-6 h-2 w-full rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : records.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {records.map((record: InterviewRecord) => (
              <HistoryCard
                key={record.id}
                record={record}
                onClick={() => navigate(`/history/${record.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="border-sketch bg-white p-10 text-center">
            <h2 className="font-heading text-xl font-bold text-ink">No history yet</h2>
            <p className="mt-2 text-sm text-ink-light">Finish an interview session to generate your first record.</p>
            <div className="mt-6 flex justify-center">
              <Button
                type="button"
                onClick={() => navigate("/")}
                className="h-10 border-sketch bg-ink px-6 text-[10px] font-bold uppercase tracking-[0.2em] text-white hover:bg-gold hover:text-ink"
              >
                Go Practice
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
