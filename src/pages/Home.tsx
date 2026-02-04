import { Github, PenTool, Settings as SettingsIcon } from "lucide-react";
import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { TECH_STACKS, type TechStack } from "@/constants/topics";
import MasteryMatrix from "@/components/dashboard/MasteryMatrix";
import StatsOverview from "@/components/dashboard/StatsOverview";
import AppHeader from "@/components/shared/AppHeader";
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
  const records = useRecordStore((s) => s.records);
  const hasApiKey = Boolean(apiKey);

  const topicStatsByLabel = useMemo(() => {
    const map = new Map<string, { count: number; sumScore: number; maxScore: number; lastTimestamp: number | null }>();
    for (const r of records) {
      const topic = typeof r.topic === "string" ? r.topic : "";
      if (!topic) continue;
      const score = typeof r.evaluation?.score === "number" && Number.isFinite(r.evaluation.score) ? r.evaluation.score : 0;
      const existing = map.get(topic) ?? { count: 0, sumScore: 0, maxScore: 0, lastTimestamp: null };
      const nextCount = existing.count + 1;
      const nextSum = existing.sumScore + score;
      const nextMax = score > existing.maxScore ? score : existing.maxScore;
      const nextLast = typeof r.timestamp === "number" && Number.isFinite(r.timestamp) ? Math.max(existing.lastTimestamp ?? 0, r.timestamp) : existing.lastTimestamp;
      map.set(topic, { count: nextCount, sumScore: nextSum, maxScore: nextMax, lastTimestamp: nextLast });
    }
    return map;
  }, [records]);

  const globalStats = useMemo(() => {
    const totalQuestions = records.length;
    if (totalQuestions === 0) return { totalQuestions: 0, globalAverage: 0 };
    const sum = records.reduce((acc, r) => {
      const score = typeof r.evaluation?.score === "number" && Number.isFinite(r.evaluation.score) ? r.evaluation.score : 0;
      return acc + score;
    }, 0);
    return { totalQuestions, globalAverage: Math.round(sum / totalQuestions) };
  }, [records]);

  const radarData = useMemo(() => {
    const byTag = new Map<string, { sum: number; count: number }>();
    for (const r of records) {
      const tags = Array.isArray(r.evaluation?.techTags) ? r.evaluation.techTags : [];
      const score = typeof r.evaluation?.score === "number" && Number.isFinite(r.evaluation.score) ? r.evaluation.score : 0;
      for (const rawTag of tags) {
        const tag = typeof rawTag === "string" ? rawTag.trim() : "";
        if (!tag) continue;
        const prev = byTag.get(tag);
        if (prev) byTag.set(tag, { sum: prev.sum + score, count: prev.count + 1 });
        else byTag.set(tag, { sum: score, count: 1 });
      }
    }

    const tagEntries = [...byTag.entries()]
      .map(([tag, v]) => ({ tag, avgScore: Math.round(v.sum / v.count), count: v.count }))
      .sort((a, b) => (b.count !== a.count ? b.count - a.count : b.avgScore - a.avgScore))
      .slice(0, 8);

    if (tagEntries.length > 0) return tagEntries.map((t) => ({ subject: t.tag, score: t.avgScore, fullMark: 100 }));

    const subjects = ["Vue", "React", "TypeScript", "JavaScript", "CSS", "Node.js"];
    return subjects.map((subject) => {
      const s = topicStatsByLabel.get(subject);
      const avgScore = s && s.count > 0 ? Math.round(s.sumScore / s.count) : 0;
      return { subject, score: avgScore, fullMark: 100 };
    });
  }, [records, topicStatsByLabel]);

  const topicSummary = useMemo(() => {
    let active = 0;
    TECH_STACKS.forEach((tech) => {
      const s = topicStatsByLabel.get(tech.label);
      if (s && s.count > 0) active += 1;
    });
    return { active, total: TECH_STACKS.length };
  }, [topicStatsByLabel]);

  useEffect(() => {
    if (apiKey) return;
    toast.error("请先配置 AI 密钥");
  }, [apiKey]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const getStatsForMatrix = useCallback(
    (topicLabel: string) => {
      const s = topicStatsByLabel.get(topicLabel);
      const count = s?.count ?? 0;
      const avgScore = s && s.count > 0 ? Math.round(s.sumScore / s.count) : 0;
      return { count, avgScore, lastActive: formatLastActive(s?.lastTimestamp ?? null) };
    },
    [topicStatsByLabel],
  );

  const handleStartInterview = useCallback(
    (tech: TechStack) => {
      navigate(`/interview/${encodeURIComponent(tech.slug)}`);
    },
    [navigate],
  );

  const handleStartBoss = useCallback(() => {
    navigate("/boss/setup");
  }, [navigate]);

  const handleJumpToMatrix = useCallback(() => {
    const element = document.getElementById("topic-board");
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col px-6 pb-3 pt-4">
        <AppHeader
          onPractice={handleJumpToMatrix}
          right={
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
          }
        />

        <div className="mb-6">
          <h1 className="font-heading text-4xl font-bold">
            前端面试 <span className="text-gold italic">训练场</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm font-light text-ink-light">
            按主题练习，模拟面试流程，记录复盘与提升。
          </p>
        </div>

        <main className="grid flex-1 min-h-0 grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-2">
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

            <div className="border-sketch bg-white p-5 transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:-translate-y-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-light">Campus 模式</span>
              <h3 className="mt-1 font-heading text-lg font-bold">Interview Boss</h3>
              <p className="mb-4 text-[11px] text-ink-light">按蓝图走流程：基础 → 深挖 → 算法。自动存档。</p>
              <button
                type="button"
                onClick={handleStartBoss}
                className="w-full bg-ink py-2.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white transition-colors hover:bg-gold hover:text-ink"
              >
                开始 Boss
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

          <div className="flex flex-col gap-4 lg:col-span-4">
            <StatsOverview
              radarData={radarData}
              totalQuestions={globalStats.totalQuestions}
              globalAverage={globalStats.globalAverage}
              isLoading={isLoading}
            />
            <div className="border-sketch relative flex flex-1 flex-col overflow-hidden bg-ink p-6 text-white shadow-sketch">
              <div className="mb-4 flex items-center gap-2 border-b border-white/10 pb-2">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                </div>
                <span className="ml-2 font-code text-[10px] text-white/40">~/mindset.js</span>
              </div>

              <div className="flex-1 font-code text-xs leading-relaxed text-gray-300">
                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">1</span>
                  <span className="text-pink-400">const</span>
                  <span className="ml-2 text-blue-300">currentMood</span>
                  <span className="ml-2 text-white">=</span>
                  <span className="ml-2 text-amber-300">"Panic"</span>;
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">2</span>
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">3</span>
                  <span className="text-gray-500">// 我知道你想死，但是你先别死</span>
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">4</span>
                  <span className="text-pink-400">if</span>
                  <span className="ml-2 text-white">(</span>
                  <span className="text-blue-300">currentMood</span>
                  <span className="ml-2 text-white">===</span>
                  <span className="ml-2 text-amber-300">"Panic"</span>
                  <span className="text-white">)</span>
                  <span className="ml-2 text-white">{"{"}</span>
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">5</span>
                  <span className="ml-4 text-purple-400">keepCalm</span>
                  <span className="text-white">();</span>
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">6</span>
                  <span className="ml-4 text-purple-400">solveThisProblem</span>
                  <span className="text-white">();</span>
                </div>

                <div className="flex">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">7</span>
                  <span className="text-white">{"}"}</span>
                </div>

                <div className="flex mt-4">
                  <span className="w-6 shrink-0 select-none text-right text-white/20 mr-4">8</span>
                  <span className="text-gray-500">// Love, from the Author 😘</span>
                </div>
              </div>

              <PenTool className="absolute bottom-4 right-4 h-16 w-16 text-white/5 rotate-12" aria-hidden="true" />
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
