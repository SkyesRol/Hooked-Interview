import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function MainLayout({
    title = "Interview Room",
    backTo = "/",
    backLabel = "返回",
    topicLabel,
    progress,
    headerRight,
    question,
    workspace,
    footer,
}: {
    title?: string;
    backTo?: string;
    backLabel?: string;
    topicLabel: string;
    progress: number;
    headerRight?: ReactNode;
    question: ReactNode;
    workspace: ReactNode;
    footer: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6">
            <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
                <header className="flex items-center gap-3">
                    <Link
                        to={backTo}
                        className={cn(
                            "inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-900",
                            "transition-colors hover:bg-slate-50",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
                        )}
                    >
                        <ArrowLeft className="h-4 w-4" />
                        {backLabel}
                    </Link>

                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h1 className="truncate text-xl font-semibold tracking-tight text-slate-950">{title}</h1>
                            {topicLabel ? <Badge variant="secondary">{topicLabel}</Badge> : null}
                        </div>
                        <div className="mt-2">
                            <Progress value={progress} />
                        </div>
                    </div>

                    {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
                </header>

                <main className="flex-1 overflow-hidden">
                    <div className="grid h-[calc(100vh-11.5rem)] grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-2 lg:grid-rows-1">
                        {question}
                        {workspace}
                    </div>
                </main>

                <footer className="flex flex-wrap items-center gap-3">{footer}</footer>
            </div>
        </div>
    );
}

