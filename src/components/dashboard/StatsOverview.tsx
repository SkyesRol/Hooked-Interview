import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RadarDatum = { subject: string; score: number; fullMark: number };

export default function StatsOverview({
  radarData,
  totalQuestions,
  globalAverage,
  isLoading,
}: {
  radarData: RadarDatum[];
  totalQuestions: number;
  globalAverage: number;
  isLoading?: boolean;
}) {
  const hasAny = totalQuestions > 0;

  return (
    <Card className="bg-white/60 backdrop-blur">
      <CardHeader>
        <CardTitle>Command Center</CardTitle>
        <CardDescription>综合能力概览（雷达图 + 核心指标）。</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="h-72 w-full rounded-xl border border-slate-200 bg-white/70 p-3">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(15, 23, 42, 0.12)" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(15, 23, 42, 0.72)", fontSize: 12 }} />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "rgba(15, 23, 42, 0.48)", fontSize: 10 }}
                axisLine={false}
              />
              <Radar dataKey="score" stroke="#0f172a" fill="#0f172a" fillOpacity={0.18} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4">
          <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="text-xs text-slate-500">Total Questions</div>
            <div className="mt-2 text-2xl font-semibold text-slate-950">{totalQuestions}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white/70 p-4">
            <div className="text-xs text-slate-500">Global Average</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="text-2xl font-semibold text-slate-950">{hasAny ? globalAverage : 0}</div>
              <div className="text-xs text-slate-500">/ 100</div>
            </div>
            <div
              className={cn(
                "mt-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
                hasAny
                  ? globalAverage >= 80
                    ? "bg-green-500/10 text-green-700 ring-green-500/20"
                    : globalAverage >= 60
                      ? "bg-yellow-500/10 text-yellow-700 ring-yellow-500/20"
                      : "bg-red-500/10 text-red-700 ring-red-500/20"
                  : "bg-slate-500/10 text-slate-600 ring-slate-500/20",
              )}
            >
              {isLoading ? "Loading" : hasAny ? "Active" : "No Data"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
