import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Difficulty } from "@/lib/db";
import { cn } from "@/lib/utils";
import { MarkdownRenderer } from "@/components/shared/MarkdownRenderer";

const difficultyBorder: Record<Difficulty, string> = {
    Simple: "border-l-green-500",
    Medium: "border-l-yellow-500",
    Hard: "border-l-red-500",
};

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
        <Card className={cn("h-full overflow-hidden border-l-4", difficultyBorder[difficulty])}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base">{title}</CardTitle>
                {meta ? <p className="text-sm text-slate-600">{meta}</p> : null}
            </CardHeader>
            <CardContent className="h-[calc(100%-4.25rem)] overflow-auto">
                <MarkdownRenderer content={content} className="prose max-w-none prose-slate" />
            </CardContent>
        </Card>
    );
}

