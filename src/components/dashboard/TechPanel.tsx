import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
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
  if (count === 0) return "bg-slate-300";
  if (avgScore < 60) return "bg-rose-500";
  if (avgScore < 80) return "bg-amber-500";
  return "bg-emerald-500";
}

const TAG_MAP: Record<string, string[]> = {
  Vue: ["#SFC", "#Reactivity"],
  React: ["#Hooks", "#State"],
  JavaScript: ["#Async", "#Scope"],
  TypeScript: ["#Types", "#Generics"],
  HTML: ["#Semantic", "#A11y"],
  CSS: ["#Layout", "#Animation"],
  "Node.js": ["#Runtime", "#APIs"],
  Electron: ["#Desktop", "#IPC"],
};

const DESC_MAP: Record<string, string> = {
  Vue: "Composition API, Pinia, and component patterns.",
  React: "Hooks, rendering, and state orchestration.",
  JavaScript: "Async flows, closures, and runtime behavior.",
  TypeScript: "Types, inference, and API design.",
  HTML: "Semantics, forms, and document structure.",
  CSS: "Layout systems, visuals, and motion.",
  "Node.js": "Server runtime, modules, and tooling.",
  Electron: "Desktop bridges, IPC, and packaging.",
};

function getDifficultyLabel(avgScore: number, count: number) {
  if (count === 0) return "NEW";
  if (avgScore < 60) return "HARD";
  if (avgScore < 80) return "MED";
  return "EASY";
}

function getDifficultyClass(label: string) {
  if (label === "HARD") return "border-rose-200 text-rose-600 bg-rose-50";
  if (label === "MED") return "border-amber-200 text-amber-600 bg-amber-50";
  if (label === "EASY") return "border-emerald-200 text-emerald-600 bg-emerald-50";
  return "border-slate-200 text-slate-500 bg-slate-50";
}

export default function TechPanel({ tech, icon: Icon, stats, onClick }: TechPanelProps) {
  const indicatorClassName = getScoreColor(stats.avgScore, stats.count);
  const difficulty = getDifficultyLabel(stats.avgScore, stats.count);
  const tags = TAG_MAP[tech] ?? ["#Basics", "#Patterns"];
  const description = DESC_MAP[tech] ?? "Core concepts and interview-ready patterns.";

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
        "group flex h-full w-full cursor-pointer flex-col border-sketch bg-white p-3 text-[11px] text-ink",
        "transition-shadow hover:shadow-sketch-hover",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
      )}
    >
      <div className="flex flex-1 flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-slate-100 text-ink">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="break-words font-heading text-sm font-bold leading-tight">{tech}</div>
              <div className="truncate text-[9px] uppercase tracking-[0.2em] text-ink-light">
                {stats.count ? "Active" : "New"}
              </div>
            </div>
          </div>
          <span
            className={cn(
              "justify-self-end whitespace-nowrap rounded border px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em]",
              getDifficultyClass(difficulty),
            )}
          >
            {difficulty}
          </span>
        </div>

        <p className="mt-2 text-[10px] leading-relaxed text-ink-light">{description}</p>

        <div className="mt-2 flex items-center gap-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-light">
          <span>{stats.count ? `${stats.count} Q` : "0 Q"}</span>
          <span>·</span>
          <span>{stats.count ? `${stats.avgScore}%` : "-"}</span>
        </div>

        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span key={tag} className="border border-slate-100 bg-slate-50 px-1 text-[8px] text-ink-light">
              {tag}
            </span>
          ))}
        </div>
        <div className="flex-1" />
      </div>

      <div className="mt-2 h-[2px] w-full bg-slate-100">
        <div
          className={cn("h-full", indicatorClassName)}
          style={{ width: `${stats.count ? stats.avgScore : 0}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-[9px] text-ink-light">
        <span>{stats.lastActive ? `Last ${stats.lastActive}` : "Not started"}</span>
        <span className="inline-flex items-center gap-1 font-semibold uppercase tracking-[0.2em] text-ink">
          Start
          <ArrowRight className="h-3 w-3" />
        </span>
      </div>
    </div>
  );
}
