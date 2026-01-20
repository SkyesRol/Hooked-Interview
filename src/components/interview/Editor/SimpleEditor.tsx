import type { ChangeEvent } from "react";
import { cn } from "@/lib/utils";

export function SimpleEditor({
    value,
    onChange,
    readOnly,
}: {
    value: string;
    onChange?: (value: string) => void;
    readOnly?: boolean;
}) {
    const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        if (readOnly) return;
        onChange?.(e.target.value);
    };
    return (
        <textarea
            value={value}
            onChange={handleChange}
            readOnly={readOnly}
            className={cn(
                "h-full w-full resize-none rounded-lg border border-slate-200 bg-white p-3 font-mono text-sm leading-relaxed text-slate-900 outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2",
                readOnly ? "opacity-70" : null,
            )}
            placeholder="在这里输入你的答案或代码..."
            spellCheck={false}
        />
    );
}

