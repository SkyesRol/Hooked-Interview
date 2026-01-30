import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot, Database, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export type QuestionSource = "AI" | "Local";

interface InterviewStarterProps {
    onSelect: (source: QuestionSource) => void;
    localEnabled: boolean;
}

export function InterviewStarter({ onSelect, localEnabled }: InterviewStarterProps) {
    return (
        <div className="group relative h-full w-full">
            {/* Stacked Paper Effect - Bottom Sheet */}
            <div className="absolute inset-0 translate-x-1.5 translate-y-1.5 rotate-1 border-sketch bg-white/50 transition-transform duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] group-hover:translate-x-2.5 group-hover:translate-y-2.5 group-hover:rotate-2" />

            {/* Main Card */}
            <Card className="relative h-full overflow-hidden border-sketch bg-white shadow-sketch transition-all duration-300 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] hover:-translate-y-1 hover:shadow-sketch-hover flex flex-col">
                <CardHeader className="pb-4">
                    <div className="flex flex-col gap-2">
                        <CardTitle className="font-heading text-3xl font-bold leading-tight tracking-tight text-ink">
                            Ready to Start?
                        </CardTitle>
                        <div className="h-1 w-16 bg-gold"></div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500 font-ui leading-relaxed">
                        Choose how you want to be interviewed. You can switch sources later.
                    </p>
                </CardHeader>
                
                <CardContent className="flex-1 flex flex-col justify-center gap-6 p-8">
                    {/* AI Option */}
                    <button
                        onClick={() => onSelect("AI")}
                        className="group/btn flex items-start gap-4 rounded-lg border-2 border-dashed border-slate-200 p-4 text-left transition-all hover:border-ink hover:bg-slate-50"
                    >
                        <div className="rounded-full bg-ink/5 p-3 text-ink transition-colors group-hover/btn:bg-ink group-hover/btn:text-white">
                            <Bot className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-ink">AI Auto-Generate</span>
                                <Sparkles className="h-3 w-3 text-gold" />
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Real-time generation based on the topic. Dynamic difficulty and infinite questions.
                            </p>
                        </div>
                    </button>

                    {/* Local Option */}
                    <button
                        onClick={() => onSelect("Local")}
                        disabled={!localEnabled}
                        className={cn(
                            "group/btn flex items-start gap-4 rounded-lg border-2 border-dashed border-slate-200 p-4 text-left transition-all",
                            localEnabled 
                                ? "hover:border-ink hover:bg-slate-50 cursor-pointer" 
                                : "opacity-50 cursor-not-allowed bg-slate-50/50"
                        )}
                    >
                        <div className={cn(
                            "rounded-full p-3 transition-colors",
                            localEnabled 
                                ? "bg-slate-100 text-slate-600 group-hover/btn:bg-ink group-hover/btn:text-white"
                                : "bg-slate-100 text-slate-400"
                        )}>
                            <Database className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <span className="font-bold text-ink">Local Database</span>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Randomly pick from your imported questions in IndexedDB.
                                {!localEnabled && <span className="block mt-1 text-red-400 italic">No questions found locally.</span>}
                            </p>
                        </div>
                    </button>
                </CardContent>
            </Card>
        </div>
    );
}
