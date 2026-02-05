import { ChevronDown, ChevronLeft, ChevronRight, FileDown, LayoutGrid, List as ListIcon, Pencil, Search, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppHeader from "@/components/shared/AppHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { resolveTech } from "@/constants/topics";
import { db, type Difficulty, type QuestionItem } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useQuestionListStore } from "@/store/useQuestionListStore";
import {
  EXPORT_FIELD_OPTIONS,
  FULL_FIELDS,
  LITE_FIELDS,
  useQuestionsExport,
  useQuestionsRepositoryQuery,
} from "./useQuestionsData";

function stripMarkdown(markdown: string) {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/[*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function difficultyBadgeVariant(difficulty: Difficulty) {
  if (difficulty === "Hard") return "destructive" as const;
  if (difficulty === "Medium") return "warning" as const;
  return "success" as const;
}

function QuestionCard({
  item,
  viewMode,
  onEdit,
  onDelete,
}: {
  item: QuestionItem;
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const snippet = stripMarkdown(item.content || "");
  const tags = Array.isArray(item.tags) ? item.tags : [];
  const displayTopic = item.topic ? resolveTech(item.topic)?.label ?? item.topic : "Untitled";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onEdit}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onEdit();
      }}
      className={cn(
        "group relative w-full cursor-pointer border-sketch bg-white p-5 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]",
        "hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold",
        viewMode === "list" && "sm:flex sm:items-start sm:gap-5",
      )}
    >
      <div className={cn("min-w-0", viewMode === "list" && "sm:flex-1")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-heading text-lg font-bold text-ink">{displayTopic}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light">
              <span>{item.questionType ?? "Code"}</span>
              <span>·</span>
              <span>{item.source ?? "user-import"}</span>
              <span>·</span>
              <Badge variant={difficultyBadgeVariant(item.difficulty)} className="text-[10px] font-bold">
                {item.difficulty}
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded border border-ink/15 bg-highlight-yellow px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em] text-ink">
              {displayTopic}
            </span>
          </div>
        </div>

        <p className={cn("mt-3 text-xs leading-relaxed text-ink-light", viewMode === "list" ? "line-clamp-2" : "line-clamp-3")}>
          {snippet ? snippet : "（No Content）"}
        </p>

        {tags.length ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tags.slice(0, 6).map((tag) => (
              <span key={tag} className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-ink-light">
                {tag}
              </span>
            ))}
            {tags.length > 6 ? (
              <span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-ink-light">
                +{tags.length - 6}
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      <div
        className={cn(
          "mt-4 flex items-center justify-end gap-2",
          "opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
          viewMode === "list" && "sm:mt-0 sm:opacity-100 sm:justify-start",
        )}
      >
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-sketch bg-white text-ink hover:text-gold"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          aria-label="Edit"
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-sketch bg-white text-red-700 hover:bg-red-50 hover:text-red-800"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}

function SkeletonCard({ viewMode }: { viewMode: "grid" | "list" }) {
  return (
    <div
      className={cn(
        "border-sketch bg-white p-5",
        "animate-pulse",
        viewMode === "list" && "sm:flex sm:items-start sm:gap-5",
      )}
    >
      <div className={cn("min-w-0", viewMode === "list" && "sm:flex-1")}>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="h-5 w-40 rounded bg-slate-100" />
            <div className="mt-2 h-3 w-56 rounded bg-slate-100" />
          </div>
          <div className="h-5 w-20 rounded bg-slate-100" />
        </div>
        <div className="mt-4 space-y-2">
          <div className="h-3 w-full rounded bg-slate-100" />
          <div className="h-3 w-5/6 rounded bg-slate-100" />
          <div className="h-3 w-2/3 rounded bg-slate-100" />
        </div>
      </div>
      <div className={cn("mt-4 flex gap-2", viewMode === "list" && "sm:mt-0")}>
        <div className="h-9 w-24 rounded bg-slate-100" />
        <div className="h-9 w-24 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function Questions() {
  const navigate = useNavigate();
  const {
    searchQuery,
    selectedTopics,
    difficultyFilter,
    viewMode,
    page,
    pageSize,
    setSearchQuery,
    toggleTopic,
    setDifficulty,
    setViewMode,
    setPage,
    resetFilters,
  } = useQuestionListStore();

  const [eraseTarget, setEraseTarget] = useState<QuestionItem | null>(null);
  const eraseCancelRef = useRef<HTMLButtonElement | null>(null);

  const {
    topics,
    topicsLoading,
    queryResult,
    listLoading,
    listError,
    totalPages,
    canPrev,
    canNext,
    anyFilters,
  } = useQuestionsRepositoryQuery({
    searchQuery,
    selectedTopics,
    difficultyFilter,
    page,
    pageSize,
    setPage,
  });

  const {
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
  } = useQuestionsExport();

  useEffect(() => {
    if (!eraseTarget) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEraseTarget(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [eraseTarget]);

  useEffect(() => {
    if (!eraseTarget) return;
    eraseCancelRef.current?.focus();
  }, [eraseTarget]);

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 pb-6 pt-4">
        <AppHeader
          active="questions"
          importLabel="IMPORT"
          right={
            <div className="flex items-center gap-2">
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
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 border-sketch bg-white p-2 shadow-sketch-hover"
                  >
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full border-b border-ink/10 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-slate-50"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        void handleExportAllQuestions("full");
                      }}
                      disabled={isExporting}
                    >
                      <div className="flex items-center justify-between">
                        <span>完整版</span>
                        <span className="text-ink-light">FULL</span>
                      </div>
                      <div className="mt-1 text-[11px] font-normal tracking-normal text-ink-light normal-case">
                        导出全部字段，适合备份与迁移
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="w-full px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-slate-50"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        void handleExportAllQuestions("lite");
                      }}
                      disabled={isExporting}
                    >
                      <div className="flex items-center justify-between">
                        <span>精简版</span>
                        <span className="text-ink-light">LITE</span>
                      </div>
                      <div className="mt-1 text-[11px] font-normal tracking-normal text-ink-light normal-case">
                        仅导出 topic / content / type / difficulty / tags
                      </div>
                    </button>
                    <button
                      type="button"
                      role="menuitem"
                      className="mt-2 w-full border-t border-ink/10 px-3 py-2 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-slate-50"
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        setIsCustomExportOpen(true);
                      }}
                      disabled={isExporting}
                    >
                      <div className="flex items-center justify-between">
                        <span>自定义字段</span>
                        <span className="text-ink-light">CUSTOM</span>
                      </div>
                      <div className="mt-1 text-[11px] font-normal tracking-normal text-ink-light normal-case">
                        勾选导出字段，适合对接外部工具
                      </div>
                    </button>
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 border-sketch bg-white text-ink hover:text-gold",
                  viewMode === "grid" && "bg-ink text-white hover:text-white",
                )}
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className={cn(
                  "h-9 w-9 border-sketch bg-white text-ink hover:text-gold",
                  viewMode === "list" && "bg-ink text-white hover:text-white",
                )}
                onClick={() => setViewMode("list")}
                aria-label="List view"
              >
                <ListIcon className="h-4 w-4" />
              </Button>
            </div>
          }
        />

        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="font-heading text-4xl font-bold">
              Question <span className="text-gold italic">Repository</span>
            </h1>
            <p className="mt-2 max-w-xl text-sm font-light text-ink-light">Search, filter, edit, and erase questions in your local notebook.</p>
          </div>
        </div>

        <div className="mb-5 grid gap-4 rounded border border-ink/10 bg-white/60 p-4 backdrop-blur-sm">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 text-ink/40" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by topic or content..."
                  className={cn(
                    "h-10 rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-6 text-sm",
                    "focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-ink",
                  )}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-0 top-1/2 -translate-y-1/2 rounded p-1 text-ink/40 hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <div className="flex items-center rounded-lg border border-ink/10 bg-white p-1 shadow-sm">
                {(["All", "Simple", "Medium", "Hard"] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                      difficultyFilter === diff
                        ? "bg-ink text-white shadow-sm"
                        : "text-ink-light hover:bg-slate-50 hover:text-ink",
                    )}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light">Topic Filter</div>
              {anyFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink-light hover:text-ink"
                  onClick={() => resetFilters()}
                >
                  Clear All
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {topicsLoading ? (
                Array.from({ length: 10 }).map((_, idx) => (
                  <span key={idx} className="h-7 w-20 rounded border border-ink/10 bg-white/70 animate-pulse" />
                ))
              ) : topics.length ? (
                topics.map((topic) => {
                  const selected = selectedTopics.includes(topic);
                  const displayTopic = resolveTech(topic)?.label ?? topic;
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-[11px] font-semibold transition-colors",
                        selected
                          ? "border-ink bg-highlight-yellow text-ink"
                          : "border-ink/15 bg-white text-ink-light hover:border-ink/40 hover:text-ink",
                      )}
                    >
                      {displayTopic}
                    </button>
                  );
                })
              ) : (
                <div className="w-full rounded border border-ink/10 bg-white/70 p-3 text-sm text-ink-light">
                  No topics found yet. Import questions to get started.
                </div>
              )}
            </div>
          </div>
        </div>

        {listError ? (
          <div className="mb-6 rounded border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            Failed to load questions: {listError instanceof Error ? listError.message : String(listError)}
          </div>
        ) : null}

        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-light">
            {listLoading ? "Loading" : `${queryResult.total} Results`}
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-sketch bg-white text-ink hover:text-gold"
              onClick={() => setPage(page - 1)}
              disabled={!canPrev}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <div className="min-w-[110px] text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light">
              Page {page} / {totalPages}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="border-sketch bg-white text-ink hover:text-gold"
              onClick={() => setPage(page + 1)}
              disabled={!canNext}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {listLoading ? (
          <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4")}>
            {Array.from({ length: viewMode === "grid" ? 9 : 6 }).map((_, idx) => (
              <SkeletonCard key={idx} viewMode={viewMode} />
            ))}
          </div>
        ) : queryResult.items.length ? (
          <div className={cn(viewMode === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : "grid gap-4")}>
            {queryResult.items.map((item) => (
              <QuestionCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onEdit={() => {
                  navigate(`/questions/edit/${encodeURIComponent(item.id)}`);
                }}
                onDelete={async () => {
                  setEraseTarget(item);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="border-sketch bg-white p-10 text-center">
            <div className="mx-auto max-w-md">
              <div className="text-2xl font-heading font-bold text-ink">Empty Sketchbook</div>
              <p className="mt-2 text-sm text-ink-light">No questions match your filters. Try clearing filters or import more questions.</p>
              <div className="mt-6 flex items-center justify-center gap-3">
                {anyFilters ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="border-sketch bg-white text-ink hover:text-gold"
                    onClick={() => resetFilters()}
                  >
                    Clear Filters
                  </Button>
                ) : null}
                <Button
                  type="button"
                  className="bg-ink text-white hover:bg-ink/90"
                  onClick={() => navigate("/import")}
                >
                  Import Questions
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {eraseTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close dialog"
            onClick={() => setEraseTarget(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="erase-title"
            aria-describedby="erase-desc"
            className="relative w-full max-w-lg border-sketch bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div id="erase-title" className="font-heading text-2xl font-bold text-ink">
                  Erase this question?
                </div>
                <div id="erase-desc" className="mt-2 text-sm text-ink-light">
                  This action cannot be undone.
                </div>
                <div className="mt-4 rounded border border-ink/10 bg-slate-50/40 p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-ink-light">Preview</div>
                  <div className="mt-2 line-clamp-3 text-sm text-ink">{stripMarkdown(eraseTarget.content || "").slice(0, 220)}</div>
                </div>
              </div>
              <button
                type="button"
                className="rounded p-1 text-ink/40 hover:text-ink"
                onClick={() => setEraseTarget(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                ref={eraseCancelRef}
                type="button"
                variant="outline"
                className="border-sketch bg-white text-ink-light hover:text-ink"
                onClick={() => setEraseTarget(null)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="bg-ink text-white hover:bg-ink/90"
                onClick={async () => {
                  const id = eraseTarget.id;
                  setEraseTarget(null);
                  try {
                    await db.questions.delete(id);
                    toast.success("Question erased from notebook");
                  } catch (err) {
                    toast.error(`Delete failed: ${err instanceof Error ? err.message : String(err)}`);
                  }
                }}
              >
                <Trash2 className="h-4 w-4" />
                Erase
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isCustomExportOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close dialog"
            onClick={() => setIsCustomExportOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="export-title"
            aria-describedby="export-desc"
            className="relative w-full max-w-2xl border-sketch bg-white p-6 shadow-lg"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div id="export-title" className="font-heading text-2xl font-bold text-ink">
                  自定义导出字段
                </div>
                <div id="export-desc" className="mt-2 text-sm text-ink-light">
                  导出 JSON 文件（100% 本地）。当前为导出全部题库内容。
                </div>
              </div>
              <button
                type="button"
                className="rounded p-1 text-ink/40 hover:text-ink"
                onClick={() => setIsCustomExportOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-light">
                Selected {selectedCustomFields.length} / {EXPORT_FIELD_OPTIONS.length}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink hover:text-gold"
                  onClick={() => {
                    setCustomExportFields((prev) => {
                      const next = { ...prev };
                      for (const { key } of EXPORT_FIELD_OPTIONS) next[key] = true;
                      return next;
                    });
                  }}
                >
                  全选
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink hover:text-gold"
                  onClick={() => {
                    setCustomExportFields((prev) => {
                      const next = { ...prev };
                      for (const { key } of EXPORT_FIELD_OPTIONS) next[key] = false;
                      return next;
                    });
                  }}
                >
                  全不选
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink hover:text-gold"
                  onClick={() => {
                    setCustomExportFields((prev) => {
                      const next = { ...prev };
                      for (const { key } of EXPORT_FIELD_OPTIONS) next[key] = false;
                      for (const key of LITE_FIELDS) next[key] = true;
                      return next;
                    });
                  }}
                >
                  精简预设
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink hover:text-gold"
                  onClick={() => {
                    setCustomExportFields((prev) => {
                      const next = { ...prev };
                      for (const { key } of EXPORT_FIELD_OPTIONS) next[key] = false;
                      for (const key of FULL_FIELDS) next[key] = true;
                      return next;
                    });
                  }}
                >
                  完整预设
                </Button>
              </div>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {EXPORT_FIELD_OPTIONS.map((opt) => (
                <label
                  key={opt.key}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded border border-ink/10 bg-white px-3 py-2 transition-colors hover:bg-slate-50",
                    customExportFields[opt.key] && "border-ink/30 bg-highlight-yellow/30",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={customExportFields[opt.key]}
                    onChange={() => {
                      setCustomExportFields((prev) => ({ ...prev, [opt.key]: !prev[opt.key] }));
                    }}
                    className="mt-1 h-4 w-4 accent-black"
                  />
                  <span className="min-w-0">
                    <span className="block text-[11px] font-bold uppercase tracking-[0.2em] text-ink">{opt.label}</span>
                    <span className="block text-xs text-ink-light">{opt.hint}</span>
                  </span>
                </label>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
              <Button
                ref={exportCancelRef}
                type="button"
                variant="outline"
                className="border-sketch bg-white text-ink-light hover:text-ink"
                onClick={() => setIsCustomExportOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                disabled={isExporting || selectedCustomFields.length === 0}
                className="bg-ink text-white hover:bg-ink/90 disabled:opacity-50"
                onClick={async () => {
                  setIsCustomExportOpen(false);
                  void handleExportAllQuestions("custom", selectedCustomFields);
                }}
              >
                {isExporting ? "EXPORTING..." : "Export"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
