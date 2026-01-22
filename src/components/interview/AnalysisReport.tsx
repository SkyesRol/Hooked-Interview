import { useMemo, useState } from "react";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { InterviewEvaluation } from "@/lib/db";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { cn } from "@/lib/utils";

type TabKey = "evaluation" | "reference";

export function AnalysisReport({ evaluation }: { evaluation: InterviewEvaluation }) {
    const [tab, setTab] = useState<TabKey>("evaluation");

    const radarData = useMemo(() => {
        const dims = evaluation.dimensions;
        return [
            { subject: "Accuracy", value: dims.accuracy, fullMark: 10 },
            { subject: "Completeness", value: dims.completeness, fullMark: 10 },
            { subject: "Logic", value: dims.logic, fullMark: 10 },
            { subject: "Code Quality", value: dims.codeQuality, fullMark: 10 },
        ];
    }, [evaluation.dimensions]);

    return (
        <div className="flex h-full flex-col overflow-hidden bg-white border-x border-b border-ink/10">
            <div className="flex items-center justify-between border-b border-ink/10 px-4 pt-2 bg-slate-50/50">
                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setTab("evaluation")}
                        className={cn(
                            "pb-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all focus:outline-none",
                            tab === "evaluation"
                                ? "border-b-2 border-ink text-ink"
                                : "border-b-2 border-transparent text-ink-light hover:text-ink"
                        )}
                    >
                        Analysis
                    </button>
                    <button
                        onClick={() => setTab("reference")}
                        className={cn(
                            "pb-2 text-[10px] font-bold uppercase tracking-[0.15em] transition-all focus:outline-none",
                            tab === "reference"
                                ? "border-b-2 border-ink text-ink"
                                : "border-b-2 border-transparent text-ink-light hover:text-ink"
                        )}
                    >
                        Reference
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto p-4">
                {tab === "evaluation" ? (
                    <div className="grid h-full gap-6 lg:grid-cols-2">
                        {/* Left: Score & Radar */}
                        <div className="flex flex-col gap-4">
                            <div className="flex items-baseline gap-2 border-b border-ink/10 pb-2">
                                <span className="font-heading text-5xl font-bold text-ink">{evaluation.score}</span>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-ink-light">Score</span>
                            </div>
                            <div className="flex-1 min-h-[160px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart data={radarData} outerRadius="70%">
                                        <PolarGrid strokeDasharray="3 3" stroke="#cbd5e1" />
                                        <PolarAngleAxis
                                            dataKey="subject"
                                            tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'Montserrat', fontWeight: 600 }}
                                        />
                                        <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                                        <Radar
                                            dataKey="value"
                                            stroke="#000"
                                            strokeWidth={2}
                                            fill="#000"
                                            fillOpacity={0.1}
                                        />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Right: Comments & Tags */}
                        <div className="flex flex-col gap-4 overflow-y-auto pr-2">
                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-light">Instructor Note</div>
                                <div className="relative bg-[#fffdeb] p-4 shadow-sm border border-yellow-200">
                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-yellow-400"></div>
                                    <div className="font-body text-lg text-ink/90 leading-relaxed">
                                        {evaluation.comment || "暂无评语"}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-[10px] font-bold uppercase tracking-widest text-ink-light">Tech Tags</div>
                                <div className="flex flex-wrap gap-2">
                                    {evaluation.techTags.length ? (
                                        evaluation.techTags.map((tag) => (
                                            <span key={tag} className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider border border-ink/20 bg-white text-ink">
                                                {tag}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-slate-400">No Tags</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MarkdownRenderer
                        content={evaluation.referenceAnswer || "暂无参考答案"}
                        className="prose max-w-none prose-slate prose-headings:font-heading prose-p:font-ui prose-code:font-code"
                    />
                )}
            </div>
        </div>
    );
}

