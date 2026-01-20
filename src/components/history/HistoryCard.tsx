import { Atom, Braces, Code2, Layers, Server, Sparkles } from "lucide-react";
import type { ComponentType } from "react";
import type { InterviewRecord } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
  if (score >= 80) return { badgeVariant: "success" as const, indicatorClassName: "bg-green-600" };
  if (score >= 60) return { badgeVariant: "warning" as const, indicatorClassName: "bg-yellow-500" };
  return { badgeVariant: "destructive" as const, indicatorClassName: "bg-red-600" };
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
    <button type="button" onClick={onClick} className="text-left">
      <Card className="h-full transition-colors hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2">
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div className="flex min-w-0 items-center gap-2">
            <Icon className={cn("h-5 w-5 shrink-0", iconClassName)} />
            <CardTitle className="truncate text-base">{record.topic}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{source}</Badge>
            <Badge variant={badgeVariant}>{score}</Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-2">
          <p className="text-sm text-slate-600">{snippet ? `${snippet}${snippet.length >= 80 ? "..." : ""}` : "（无题目内容）"}</p>
          <p className="text-xs text-slate-500">{formatRelativeTime(record.timestamp)}</p>
        </CardContent>

        <CardFooter className="w-full">
          <Progress value={score} indicatorClassName={indicatorClassName} />
        </CardFooter>
      </Card>
    </button>
  );
}

