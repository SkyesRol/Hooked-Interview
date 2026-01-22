import { PenTool, Github, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TECH_STACKS, type TechStack } from "@/constants/topics";
import MasteryMatrix from "@/components/dashboard/MasteryMatrix";
import StatsOverview from "@/components/dashboard/StatsOverview";
import { cn } from "@/lib/utils";
import { useRecordStore } from "@/store/useRecordStore";
import { useSettingsStore } from "@/store/useSettingsStore";

function formatLastActive(lastTimestamp: number | null) {
  if (!lastTimestamp) return undefined;
  const diff = Date.now() - lastTimestamp;
  const day = 24 * 60 * 60 * 1000;
  if (diff > 7 * day) return undefined;
  if (diff < 60 * 60 * 1000) return `${Math.max(1, Math.floor(diff / (60 * 1000)))}m ago`;
  if (diff < day) return `${Math.max(1, Math.floor(diff / (60 * 60 * 1000)))}h ago`;
  return `${Math.max(1, Math.floor(diff / day))}d ago`;
}

export default function Home() {
  const navigate = useNavigate();
  const apiKey = useSettingsStore((s) => s.apiKey);
  const loadRecords = useRecordStore((s) => s.loadRecords);
  const isLoading = useRecordStore((s) => s.isLoading);
  const getTopicStats = useRecordStore((s) => s.getTopicStats);
  const getRadarData = useRecordStore((s) => s.getRadarData);
  const getGlobalStats = useRecordStore((s) => s.getGlobalStats);
  const hasApiKey = Boolean(apiKey);

  useEffect(() => {
    if (apiKey) return;
    toast.error("请先配置 AI 密钥");
  }, [apiKey]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const radarData = useMemo(() => getRadarData(), [getRadarData]);
  const globalStats = useMemo(() => getGlobalStats(), [getGlobalStats]);
  const topicSummary = useMemo(() => {
    let active = 0;
    TECH_STACKS.forEach((tech) => {
      const stats = getTopicStats(tech.label);
      if (stats.count > 0) active += 1;
    });
    return { active, total: TECH_STACKS.length };
  }, [getTopicStats]);

  const getStatsForMatrix = useCallback(
    (topicLabel: string) => {
      const s = getTopicStats(topicLabel);
      return { count: s.count, avgScore: s.avgScore, lastActive: formatLastActive(s.lastTimestamp) };
    },
    [getTopicStats],
  );

  const handleStartInterview = useCallback(
    (tech: TechStack) => {
      navigate(`/interview/${encodeURIComponent(tech.slug)}`);
    },
    [navigate],
  );

  const handleJumpToMatrix = useCallback(() => {
    const element = document.getElementById("topic-board");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 pb-3 pt-4">
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
              <button type="button" onClick={handleJumpToMatrix} className="transition-colors hover:text-ink">
                PRACTICE
              </button>
              <button type="button" onClick={() => navigate("/history")} className="transition-colors hover:text-ink">
                HISTORY
              </button>
              <button type="button" onClick={() => navigate("/import")} className="transition-colors hover:text-ink">
                IMPORT QUESTIONS
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span
              role="status"
              aria-label={hasApiKey ? "API 已连接" : "API 未配置"}
              className={cn(
                "inline-flex items-center gap-2 rounded border px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.2em]",
                hasApiKey ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-rose-200 bg-rose-50 text-rose-700",
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", hasApiKey ? "bg-emerald-500" : "bg-rose-500")} aria-hidden />
              <span className="hidden sm:inline">{hasApiKey ? "API ACCESS GRANTED" : "API ACCESS REQUIRED"}</span>
              <span className="sm:hidden">API</span>
            </span>
            <button
              type="button"
              onClick={() => navigate("/settings", { state: { from: "/" } })}
              className={cn(
                "inline-flex h-8 items-center justify-center gap-2 rounded border border-ink bg-white px-2",
                "text-[10px] font-bold uppercase tracking-[0.15em] text-ink",
                "transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-ink hover:text-white",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2",
              )}
              aria-label="打开设置"
            >
              <SettingsIcon className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>
        </nav>

        <div className="mb-6">
          <h1 className="font-heading text-4xl font-bold">
            前端面试 <span className="text-gold italic">训练场</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm font-light text-ink-light">
            按主题练习，模拟面试流程，记录复盘与提升。
          </p>
        </div>

        <main className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-3">
            <div className="border-sketch bg-white p-5 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:-translate-y-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-light">
                快速开始
              </span>
              <h3 className="mt-1 font-heading text-lg font-bold">准备开始一轮模拟面试？</h3>
              <p className="mb-4 text-[11px] text-ink-light">从任意卡片进入：出题 → 作答 → 评分 → 复盘。</p>
              <button
                type="button"
                onClick={handleJumpToMatrix}
                className="w-full bg-ink py-2.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-gold hover:text-ink"
              >
                开始练习
              </button>
            </div>

            <div className="border-sketch flex flex-1 flex-col justify-between bg-white p-5">
              <div className="space-y-3">
                <div className="flex items-end justify-between border-b border-dashed border-slate-100 pb-2">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-light">Total Questions</span>
                    <p className="font-heading text-xl font-bold">{globalStats.totalQuestions}</p>
                  </div>
                  <span className="text-xs text-ink-light font-semibold">Q</span>
                </div>
                <div className="flex items-end justify-between border-b border-dashed border-slate-100 pb-2">
                  <div>
                    <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-light">Average Score</span>
                    <p className="font-heading text-xl font-bold">
                      {globalStats.totalQuestions ? globalStats.globalAverage : 0}
                    </p>
                  </div>
                  <span className="text-xs text-ink-light font-semibold">/ 100</span>
                </div>
              </div>
              <div className="pt-4">
                <span className="text-[12px] font-semibold uppercase tracking-[0.2em] text-ink-light">Sync Status</span>
                <div className="mt-1 flex items-center gap-2 text-[10px] text-ink-light">
                  <span className={cn("h-1.5 w-1.5 rounded-full", isLoading ? "bg-amber-500" : "bg-emerald-500")} />
                  <span className="font-semibold italic text-[12px]">{isLoading ? "Loading" : "Ready"}</span>
                </div>
              </div>
            </div>
          </div>

          <div id="topic-board" className="flex min-h-0 flex-col lg:col-span-6">
            <div className="mb-4 flex items-baseline justify-between">
              <h2 className="border-b-2 border-gold font-heading text-2xl font-bold italic">主题题板</h2>
              <span className="text-[8px] font-semibold uppercase tracking-[0.2em] text-ink-light">
                已练主题：{topicSummary.active}/{topicSummary.total}
              </span>
            </div>
            <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto pr-1">
              <MasteryMatrix getStats={getStatsForMatrix} onStartInterview={handleStartInterview} />
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:col-span-3">
            <StatsOverview
              radarData={radarData}
              totalQuestions={globalStats.totalQuestions}
              globalAverage={globalStats.globalAverage}
              isLoading={isLoading}
            />
            <div className="border-sketch relative flex flex-1 flex-col justify-center overflow-hidden bg-ink p-5 text-white pb-8">
              <PenTool className="absolute bottom-4 right-4 h-12 w-12 text-white/10" aria-hidden="true" />
              <p className="mt-2 text-[15px] font-light italic leading-relaxed text-gray-300">
                我知道你想死，但是你先别死，先把这道题做了。
                <div className="mt-2 text-[13px] font-light italic leading-relaxed text-gray-300">
                  —— Love, from the Author 😘
                </div>
              </p>
            </div>
          </div>
        </main>

        <footer className="flex items-center justify-between border-t border-slate-100 py-3 text-[8px] font-semibold uppercase tracking-[0.15em] text-ink-light">
          <div className="flex items-center gap-4">
            <button type="button" className="transition-colors hover:text-ink">
              Privacy
            </button>
            <button type="button" className="flex items-center gap-1 transition-colors hover:text-ink">
              <Github className="h-3 w-3" />
              Open Source
            </button>
          </div>
          <span>© 2026 Tech Mastery Matrix.</span>
        </footer>
      </div>
    </div>
  );
}
