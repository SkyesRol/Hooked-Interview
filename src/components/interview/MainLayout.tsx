import type { ReactNode } from "react";
import { ArrowLeft, PenTool } from "lucide-react";
import { Link } from "react-router-dom";

export function MainLayout({
    title = "Interview Room",
    backTo = "/",
    backLabel = "Back",
    topicLabel,
    progress,
    headerRight,
    question,
    editor,
    analysis,
    footer,
    isGenerating = false,
}: {
    title?: string;
    backTo?: string;
    backLabel?: string;
    topicLabel: string;
    progress: number;
    headerRight?: ReactNode;
    question: ReactNode;
    editor: ReactNode;
    analysis?: ReactNode;
    footer: ReactNode;
    isGenerating?: boolean;
}) {
    return (
        <div className="min-h-screen paper-surface px-4 py-6 font-ui text-ink">
            {/* Expanded width container for better coding experience */}
            <div className="mx-auto flex w-full max-w-[95%] flex-col gap-6">
                <header className="flex items-center gap-4 border-b border-ink/10 pb-4">
                    <Link
                        to={backTo}
                        className="group flex items-center gap-2 text-sm font-semibold text-ink-light hover:text-ink transition-colors"
                    >
                        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        <span className="font-heading italic tracking-wide">{backLabel}</span>
                    </Link>

                    <div className="min-w-0 flex-1 pl-4">
                        <div className="flex items-baseline gap-3">
                            <h1 className="truncate font-heading text-2xl font-bold tracking-tight text-ink">{title}</h1>
                            {topicLabel ? (
                                <span className="rounded-sm border border-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink">
                                    {topicLabel}
                                </span>
                            ) : null}
                        </div>

                        <div className="mt-3 h-5 w-full max-w-xs">
                            {isGenerating ? (
                                <div className="flex items-center gap-2">
                                    <div className="h-px flex-1 bg-ink/5 overflow-hidden">
                                        <div className="h-full w-1/3 bg-ink/40 animate-[shimmer_1.5s_infinite_linear] -translate-x-full" />
                                    </div>
                                    <div className="flex items-center gap-1.5 text-ink animate-pulse">
                                        <PenTool className="h-3 w-3" />
                                        <span className="font-sketch text-sm tracking-wide">AI Drafting...</span>
                                    </div>
                                    <style>{`
                                        @keyframes shimmer {
                                            0% { transform: translateX(-100%); }
                                            100% { transform: translateX(300%); }
                                        }
                                    `}</style>
                                </div>
                            ) : (
                                <div className="h-px w-full bg-ink/10 mt-2.5">
                                    <div
                                        className="h-full bg-ink transition-all duration-500"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {headerRight ? <div className="flex items-center gap-2">{headerRight}</div> : null}
                </header>

                <main className="flex-1 flex flex-col gap-8">
                    {/* Top Section: Question + Editor */}
                    <div className="flex h-[calc(100vh-180px)] gap-8 transition-all duration-300 ease-in-out">
                        {/* Question Panel */}
                        <div className="flex w-1/3 min-w-[350px] flex-col transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]">
                            <div className="h-full w-full  transition-all duration-300">
                                {question}
                            </div>
                        </div>

                        {/* Editor Panel */}
                        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                            {editor}
                        </div>
                    </div>

                    {/* Bottom Section: Analysis Report (Appears after submission) */}
                    {analysis && (
                        <div className="min-h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {analysis}
                        </div>
                    )}
                </main>

                <footer className="flex flex-wrap items-center justify-end gap-4 border-t border-ink/10 pt-4">{footer}</footer>
            </div>
        </div>
    );
}

