import { useMemo, useState } from "react";
import { Radar, RadarChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, ResponsiveContainer } from "recharts";
import type { InterviewEvaluation } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";
import { Button } from "@/components/ui/button";

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
        <Card className="h-full overflow-hidden">
            <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                    <CardTitle className="text-base">Analysis</CardTitle>
                    <Badge variant="success">Score {evaluation.score}</Badge>
                    <div className="ml-auto flex items-center gap-2">
                        <Button size="sm" variant={tab === "evaluation" ? "default" : "outline"} onClick={() => setTab("evaluation")}>
                            Evaluation
                        </Button>
                        <Button size="sm" variant={tab === "reference" ? "default" : "outline"} onClick={() => setTab("reference")}>
                            Reference
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="h-[calc(100%-4.25rem)] overflow-auto">
                {tab === "evaluation" ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                        <div className="h-56 rounded-lg border border-slate-200 bg-white">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadarChart data={radarData} outerRadius="70%">
                                    <PolarGrid />
                                    <PolarAngleAxis dataKey="subject" />
                                    <PolarRadiusAxis domain={[0, 10]} tickCount={6} />
                                    <Radar dataKey="value" stroke="#0f172a" fill="#0f172a" fillOpacity={0.2} />
                                </RadarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="space-y-3">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-slate-900">Tech Tags</div>
                                <div className="flex flex-wrap gap-2">
                                    {evaluation.techTags.length ? (
                                        evaluation.techTags.map((tag) => (
                                            <Badge key={tag} variant="outline">
                                                {tag}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-slate-600">暂无标签</span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-slate-900">Comment</div>
                                <div className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                                    {evaluation.comment || "暂无评语"}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <MarkdownRenderer content={evaluation.referenceAnswer || "暂无参考答案"} className="prose max-w-none prose-slate" />
                )}
            </CardContent>
        </Card>
    );
}

