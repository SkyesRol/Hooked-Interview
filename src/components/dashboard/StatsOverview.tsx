import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type RadarDatum = { subject: string; score: number; fullMark: number };

function wrapText(text: string, maxCharsPerLine = 10): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = words[0] || "";

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    if (currentLine.length + 1 + word.length <= maxCharsPerLine) {
      currentLine += " " + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function CustomTick({
  payload,
  x,
  y,
  textAnchor,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verticalAnchor,
  ...props
}: {
  payload?: { value: string };
  x?: number;
  y?: number;
  textAnchor?: "start" | "middle" | "end" | "inherit";
  verticalAnchor?: string;
  [key: string]: unknown;
}) {
  const val = payload?.value || "";
  const lines = wrapText(val);
  return (
    <text
      x={x}
      y={y}
      textAnchor={textAnchor}
      fill="#2C3E50"
      fontSize={11}
      fontFamily="Architects Daughter"
      {...props}
    >
      {lines.map((line, index) => (
        <tspan
          x={x}
          dy={index === 0 ? (lines.length > 1 ? "-0.4em" : "0.3em") : "1.2em"}
          key={index}
        >
          {line}
        </tspan>
      ))}
    </text>
  );
}

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
    <Card className="border-sketch bg-white shadow-sketch">
      <CardHeader>
        <CardTitle className="font-heading text-xl">Skill Radar</CardTitle>
        <CardDescription className="text-xs text-ink-light">综合能力草图与当前记录。</CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6">
        <div className="h-[360px] w-full rounded-xl border border-slate-200 bg-white">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart
              data={radarData}
              outerRadius="100%"
              margin={{ top: 30, right: 60, bottom: 30, left: 60 }}
            >
              <PolarGrid stroke="rgba(44, 62, 80, 0.35)" strokeDasharray="4 6" />
              <PolarAngleAxis
                dataKey="subject"
                tickLine={false}
                tick={<CustomTick />}
              />
              <PolarRadiusAxis
                angle={30}
                domain={[0, 100]}
                tick={{ fill: "#5D6D7E", fontSize: 10, fontFamily: "Patrick Hand" }}
                axisLine={false}
              />
              <Radar dataKey="score" stroke="#2C3E50" fill="#2C3E50" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-light">Total Questions</div>
            <div className="mt-2 font-heading text-xl font-bold text-ink">{totalQuestions}</div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-3">
            <div className="text-[9px] font-semibold uppercase tracking-[0.2em] text-ink-light">Global Average</div>
            <div className="mt-2 flex items-baseline gap-2">
              <div className="font-heading text-xl font-bold text-ink">{hasAny ? globalAverage : 0}</div>
              <div className="text-[10px] font-semibold text-ink-light">/ 100</div>
            </div>
            <div
              className={cn(
                "mt-3 inline-flex items-center rounded-full border border-slate-200 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]",
                hasAny
                  ? globalAverage >= 80
                    ? "bg-highlight-green"
                    : globalAverage >= 60
                      ? "bg-highlight-yellow"
                      : "bg-highlight-red"
                  : "bg-white/80 text-ink-light",
              )}
            >
              {isLoading ? "Sketching" : hasAny ? "Active" : "No Data"}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
