import { Code2, Loader2, Type } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SimpleEditor } from "./SimpleEditor";
import { Button } from "@/components/ui/button";

const MonacoWrapper = lazy(() => import("./MonacoWrapper").then((m) => ({ default: m.MonacoWrapper })));

export function InterviewEditor({
    value,
    onChange,
    disabled,
    readOnly,
}: {
    value: string;
    onChange?: (value: string) => void;
    disabled?: boolean;
    readOnly?: boolean;
}) {
    const isMobile = useMediaQuery("(max-width: 768px)");
    const finalReadOnly = Boolean(readOnly || disabled);

    // 默认使用 Simple Editor (Textarea)，即 false
    const [useMonaco, setUseMonaco] = useState(false);

    // 移动端强制降级，不显示切换 Tab
    if (isMobile) return <SimpleEditor value={value} onChange={onChange} readOnly={finalReadOnly} />;

    return (
        <div className="flex h-full flex-col gap-2">
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant={!useMonaco ? "default" : "outline"}
                    onClick={() => setUseMonaco(false)}
                    className="h-7 px-3 text-xs"
                    type="button"
                >
                    <Type className="mr-1 h-3 w-3" />
                    文本模式
                </Button>
                <Button
                    size="sm"
                    variant={useMonaco ? "default" : "outline"}
                    onClick={() => setUseMonaco(true)}
                    className="h-7 px-3 text-xs"
                    type="button"
                >
                    <Code2 className="mr-1 h-3 w-3" />
                    专业编辑器
                </Button>
            </div>

            <div className="flex-1 overflow-hidden">
                {useMonaco ? (
                    <div className="h-full rounded-lg border border-slate-200 bg-white">
                        <Suspense
                            fallback={
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    正在加载编辑器...
                                </div>
                            }
                        >
                            <MonacoWrapper value={value} onChange={onChange} readOnly={finalReadOnly} />
                        </Suspense>
                    </div>
                ) : (
                    <SimpleEditor value={value} onChange={onChange} readOnly={finalReadOnly} />
                )}
            </div>
        </div>
    );
}
