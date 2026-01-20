import type { LucideIcon } from "lucide-react";
import { ArrowRight, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type TechPanelStats = {
  count: number;
  avgScore: number;
  lastActive?: string;
};

export type TechPanelProps = {
  tech: string;
  icon: LucideIcon;
  stats: TechPanelStats;
  onClick: () => void;
};

function getScoreColor(avgScore: number, count: number) {
  if (count === 0) return "bg-slate-400";
  if (avgScore < 60) return "bg-red-500";
  if (avgScore < 80) return "bg-yellow-500";
  return "bg-green-500";
}

export default function TechPanel({ tech, icon: Icon, stats, onClick }: TechPanelProps) {
  const isMaster = stats.avgScore > 90 && stats.count > 0;
  const indicatorClassName = getScoreColor(stats.avgScore, stats.count);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key !== "Enter" && e.key !== " ") return;
        e.preventDefault();
        onClick();
      }}
      className={cn(
        "group relative cursor-pointer overflow-hidden rounded-xl border border-slate-200 bg-white/60 p-6 text-slate-950 shadow-sm backdrop-blur",
        "transition-all hover:-translate-y-1 hover:border-slate-900/20 hover:shadow-md",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/5 via-transparent to-slate-900/10" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-50 shadow">
            Deploy Interview
            <ArrowRight className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900/5 text-slate-900">
              <Icon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-base font-semibold">{tech}</div>
              <div className="text-xs text-slate-500">
                {stats.count ? `平均分 ${stats.avgScore}` : "Unexplored"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {stats.lastActive ? <Badge variant="secondary">最近活跃</Badge> : null}
            {isMaster ? (
              <Tooltip content="Master">
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                  <Award className="mr-1 h-3.5 w-3.5" />
                  Master
                </span>
              </Tooltip>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Mastery</span>
            <span className="font-medium text-slate-900">{stats.count ? `${stats.avgScore}%` : "-"}</span>
          </div>
          <Progress value={stats.count ? stats.avgScore : 0} className="h-2 bg-slate-100" indicatorClassName={indicatorClassName} />
        </div>

        <div className="text-xs text-slate-600">{stats.count ? `${stats.count} 题已归档` : "0 题已归档"}</div>
      </div>
    </div>
  );
}

