import type { HTMLAttributes } from "react";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "outline" | "success" | "warning" | "destructive";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClassName: Record<BadgeVariant, string> = {
  default: "border-transparent bg-slate-900 text-slate-50",
  secondary: "border-transparent bg-slate-100 text-slate-900",
  outline: "bg-transparent text-slate-900",
  success: "border-transparent bg-green-600 text-white",
  warning: "border-transparent bg-yellow-500 text-slate-950",
  destructive: "border-transparent bg-red-600 text-white",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant = "default", ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium leading-none",
        variantClassName[variant],
        variant === "outline" ? "border-slate-200" : "border-transparent",
        className,
      )}
      {...props}
    />
  );
});
Badge.displayName = "Badge";

