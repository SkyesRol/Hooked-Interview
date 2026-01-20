import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export type QuestionSource = "AI" | "Local";

export function SourceSelectorDialog({
    open,
    localEnabled,
    onSelect,
}: {
    open: boolean;
    localEnabled: boolean;
    onSelect: (source: QuestionSource) => void;
}) {
    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>选择出题来源</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-slate-600">
                    <p>AI 出题：实时生成题目并评分。</p>
                    <p>本地题库：从 IndexedDB 随机抽题（如果你已导入题库）。</p>
                </CardContent>
                <CardFooter className="gap-3">
                    <Button onClick={() => onSelect("AI")}>AI 出题</Button>
                    <Button variant="outline" onClick={() => onSelect("Local")} disabled={!localEnabled}>
                        本地题库
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}

