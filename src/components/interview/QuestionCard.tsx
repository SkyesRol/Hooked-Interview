import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Difficulty } from "@/lib/db";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

export function QuestionCard({
    title,
    content,
    difficulty,
    meta,
}: {
    title: string;
    content: string;
    difficulty: Difficulty;
    meta?: string;
}) {
    return (
        <div className="group relative h-full w-full">
            {/* Stacked Paper Effect - Bottom Sheet */}
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 border-sketch bg-white/50 transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:translate-x-2.5 group-hover:translate-y-2.5 group-hover:rotate-2" />

            {/* Main Card */}
            <Card className="relative h-full overflow-hidden border-sketch bg-white shadow-sketch transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:-translate-y-1 hover:shadow-sketch-hover">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="font-heading text-3xl font-bold leading-tight tracking-tight text-ink">{title}</CardTitle>
                        <div className="h-1 w-16 bg-gold"></div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-light">
                        <span>{difficulty}</span>
                        {meta && (
                            <>
                                <span>·</span>
                                <span>{meta}</span>
                            </>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="h-[calc(100%-7rem)] overflow-auto">
                    <MarkdownRenderer
                        content={content}
                        className="prose max-w-none prose-slate prose-headings:font-heading prose-p:font-ui prose-p:leading-loose prose-pre:border prose-pre:border-ink/10 prose-pre:bg-slate-50 prose-code:font-code prose-code:text-ink"
                    />
                </CardContent>
            </Card>
        </div>
    );
}

