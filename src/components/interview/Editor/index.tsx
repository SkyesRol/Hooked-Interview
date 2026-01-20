import { Loader2 } from "lucide-react";
import { Suspense, lazy } from "react";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { SimpleEditor } from "./SimpleEditor";

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

    if (isMobile) return <SimpleEditor value={value} onChange={onChange} readOnly={finalReadOnly} />;

    return (
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
    );
}

