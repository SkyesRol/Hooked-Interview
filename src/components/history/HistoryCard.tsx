import { Atom, Braces, Code2, Layers, Server, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import type { InterviewRecord } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

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

function formatRelativeTime(timestamp: number) {
  const diffMs = timestamp - Date.now();
  const abs = Math.abs(diffMs);
  const minute = 60_000;
  const hour = 3_600_000;
  const day = 86_400_000;

  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (abs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (abs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  return rtf.format(Math.round(diffMs / day), "day");
}

function getScoreMeta(score: number) {
  if (score >= 80) return { badgeVariant: "success" as const, indicatorClassName: "bg-emerald-500" };
  if (score >= 60) return { badgeVariant: "warning" as const, indicatorClassName: "bg-yellow-500" };
  return { badgeVariant: "destructive" as const, indicatorClassName: "bg-rose-500" };
}

function getTopicIcon(topic: string): { Icon: ComponentType<{ className?: string }>; className: string } {
  const t = topic.toLowerCase();
  if (t.includes("react")) return { Icon: Atom, className: "text-sky-600" };
  if (t.includes("vue")) return { Icon: Layers, className: "text-emerald-600" };
  if (t.includes("typescript") || t === "ts") return { Icon: Braces, className: "text-blue-700" };
  if (t.includes("javascript") || t === "js") return { Icon: Code2, className: "text-yellow-600" };
  if (t.includes("node")) return { Icon: Server, className: "text-lime-700" };
  return { Icon: Sparkles, className: "text-slate-700" };
}

export function HistoryCard({ record, onClick }: { record: InterviewRecord; onClick: () => void }) {
  const score = typeof record.evaluation?.score === "number" ? record.evaluation.score : 0;
  const { badgeVariant, indicatorClassName } = getScoreMeta(score);
  const { Icon, className: iconClassName } = getTopicIcon(record.topic);
  const snippet = stripMarkdown(record.questionContent).slice(0, 80);
  const source = record.sourceType ?? "Unknown";

  return (
    <button type="button" onClick={onClick} className="group w-full text-left focus:outline-none">
      <div className="flex h-full flex-col justify-between border-sketch bg-white p-5 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-gold">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} />
            <h3 className="truncate font-heading text-lg font-bold text-ink">{record.topic}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded border border-ink/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-light">
              {source}
            </span>
            <Badge variant={badgeVariant} className="text-[10px] font-bold">
              {score}
            </Badge>
          </div>
        </div>

        <div className="mb-4 flex-1 space-y-2">
          <p className="line-clamp-2 text-xs text-ink-light">
            {snippet ? snippet : "（No Content）"}
          </p>
          <p className="text-[10px] font-medium text-ink/40">
            {formatRelativeTime(record.timestamp)}
          </p>
        </div>

        <div className="w-full">
          <Progress value={score} indicatorClassName={indicatorClassName} className="h-1.5" />
        </div>
      </div>
    </button>
  );
}
