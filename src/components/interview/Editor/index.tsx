import { Loader2 } from "lucide-react";
import { Suspense, lazy, useState } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SimpleEditor } from "./SimpleEditor";
import { cn } from "@/lib/utils";

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
        <div className="flex h-full flex-col bg-white/50">
            <div className="flex items-center gap-2 border-b border-ink/5 px-4 pt-3 pb-2">
                <button
                    onClick={() => setUseMonaco(false)}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all",
                        !useMonaco
                            ? "bg-ink text-white shadow-sm"
                            : "text-ink/40 hover:bg-ink/5 hover:text-ink"
                    )}
                    type="button"
                >
                    <span className="font-sketch tracking-wider normal-case text-sm">Text Mode</span>
                </button>
                <button
                    onClick={() => setUseMonaco(true)}
                    className={cn(
                        "rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-widest transition-all",
                        useMonaco
                            ? "bg-ink text-white shadow-sm"
                            : "text-ink/40 hover:bg-ink/5 hover:text-ink"
                    )}
                    type="button"
                >
                    <span className="font-sketch tracking-wider normal-case text-sm">Code Editor</span>
                </button>
            </div>

            <div className="relative flex-1 overflow-hidden">
                {useMonaco ? (
                    <div className="h-full">
                        <Suspense
                            fallback={
                                <div className="flex h-full items-center justify-center gap-2 text-sm text-slate-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="font-sketch">Loading Editor...</span>
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
