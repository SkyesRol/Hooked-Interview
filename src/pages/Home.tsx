import { useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { FileUp, History as HistoryIcon, Settings } from "lucide-react";
import type { TechStack } from "@/constants/topics";
import MasteryMatrix from "@/components/dashboard/MasteryMatrix";
import StatsOverview from "@/components/dashboard/StatsOverview";
import { Tooltip } from "@/components/ui/tooltip";
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

  useEffect(() => {
    if (apiKey) return;
    toast.error("请先配置 AI 密钥");
    navigate("/settings", { replace: true, state: { from: "/" } });
  }, [apiKey, navigate]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const radarData = useMemo(() => getRadarData(), [getRadarData]);
  const globalStats = useMemo(() => getGlobalStats(), [getGlobalStats]);

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

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-6xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">Tech Mastery Matrix</h1>
          <p className="text-sm text-slate-600">Select a stack to challenge AI-generated questions.</p>
        </div>

        <div className="mt-6">
          <StatsOverview
            radarData={radarData}
            totalQuestions={globalStats.totalQuestions}
            globalAverage={globalStats.globalAverage}
            isLoading={isLoading}
          />
        </div>

        <div className="mt-6">
          <MasteryMatrix getStats={getStatsForMatrix} onStartInterview={handleStartInterview} />
        </div>
      </div>

      <div className="fixed bottom-6 right-6 flex flex-col gap-3">
        <Tooltip content="导入题库" side="left">
          <button
            type="button"
            onClick={() => navigate("/import")}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-lg",
              "transition-colors hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
            aria-label="打开导入题库"
          >
            <FileUp className="h-5 w-5" />
          </button>
        </Tooltip>

        <Tooltip content="历史记录" side="left">
          <button
            type="button"
            onClick={() => navigate("/history")}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-lg",
              "transition-colors hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
            aria-label="打开历史记录"
          >
            <HistoryIcon className="h-5 w-5" />
          </button>
        </Tooltip>

        <Tooltip content="设置" side="left">
          <button
            type="button"
            onClick={() => navigate("/settings", { state: { from: "/" } })}
            className={cn(
              "inline-flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-lg",
              "transition-colors hover:bg-slate-50",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
            aria-label="打开设置"
          >
            <Settings className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
