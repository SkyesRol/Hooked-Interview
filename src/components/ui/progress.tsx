import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export type ProgressProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value?: number;
  indicatorClassName?: string;
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, indicatorClassName, value = 0, style, ...props }, ref) => {
    const v = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-slate-200/60", className)}
        style={style}
        {...props}
      >
        <div
          className={cn("h-full rounded-full bg-slate-900 transition-all", indicatorClassName)}
          style={{ width: `${v}%` }}
        />
      </div>
    );
  },
);
Progress.displayName = "Progress";

