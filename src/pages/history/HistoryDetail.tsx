import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2, Code2, FileText } from "lucide-react";
import { AnalysisReport } from "@/components/interview/AnalysisReport";
import { InterviewEditor } from "@/components/interview/Editor";
import { MainLayout } from "@/components/interview/MainLayout";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Difficulty, type InterviewRecord, db } from "@/lib/db";
import { cn } from "@/lib/utils";
import { useRecordStore } from "@/store/useRecordStore";

function normalizeDifficulty(input: unknown): Difficulty {
  if (input === "Simple" || input === "Medium" || input === "Hard") return input;
  return "Medium";
}

function scoreVariant(score: number) {
  if (score >= 80) return "success" as const;
  if (score >= 60) return "warning" as const;
  return "destructive" as const;
}

export default function HistoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const removeRecord = useRecordStore((s) => s.removeRecord);

  const [record, setRecord] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!id) {
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const found = await db.records.get(id);
        if (!mounted) return;
        setRecord(found ?? null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [id]);

  const score = record?.evaluation?.score ?? 0;
  const headerRight = useMemo(() => {
    if (!record) return null;
    return (
      <>
        <Badge variant={scoreVariant(score)} className="text-xs font-bold">{score} / 100</Badge>
        <Button
          variant="outline"
          size="sm"
          className="border-sketch bg-white text-ink hover:text-gold"
          onClick={() => {
            navigate(`/interview/${encodeURIComponent(record.topic)}`, {
              state: {
                retryMode: true,
                topic: record.topic,
                fixedQuestion: {
                  id: record.questionId ?? crypto.randomUUID(),
                  content: record.questionContent,
                  type: record.questionType ?? "Code",
                  difficulty: normalizeDifficulty(record.difficulty),
                  source: record.sourceType ?? "AI",
                },
              },
            });
          }}
        >
          Retry
        </Button>
        <Button
          variant="outline"
          size="sm"
          className={cn("border-sketch border-red-200 bg-white text-red-700 hover:bg-red-50 hover:text-red-800 hover:border-red-300")}
          onClick={async () => {
            if (!id) return;
            const ok = window.confirm("Delete this record?");
            if (!ok) return;
            await removeRecord(id);
            navigate("/history", { replace: true });
          }}
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </>
    );
  }, [id, navigate, record, removeRecord, score]);

  if (loading) {
    return (
      <div className="min-h-screen paper-surface px-4 py-10 font-ui text-ink">
        <div className="mx-auto w-full max-w-6xl border-sketch bg-white p-8 text-sm text-ink-light">
          Loading Record...
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen paper-surface px-4 py-10 font-ui text-ink">
        <div className="mx-auto w-full max-w-6xl border-sketch bg-white p-8">
          <h1 className="font-heading text-xl font-bold text-ink">Record not found</h1>
          <p className="mt-2 text-sm text-ink-light">This history record may have been deleted.</p>
          <div className="mt-6">
            <Button
              onClick={() => navigate("/history")}
              className="bg-ink text-white hover:bg-gold hover:text-ink font-bold uppercase tracking-wider"
            >
              Back to History
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      title="History Review"
      backTo="/history"
      backLabel="History"
      topicLabel={record.topic}
      progress={score}
      headerRight={headerRight}
      question={
        <div className="h-full overflow-hidden">
          <QuestionCard
            title="Question"
            content={record.questionContent || "（No Content）"}
            difficulty={normalizeDifficulty(record.difficulty)}
            meta={record.sourceType ? `${record.sourceType} · ${record.questionType ?? "Code"}` : "Snapshot"}
          />
        </div>
      }
      editor={
        <div className="flex h-full flex-col overflow-hidden border-sketch bg-white">
          <div className="flex items-center justify-between border-b border-ink/10 bg-slate-50/30 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-ink-light">
            <div className="flex items-center gap-2">
              <Code2 className="h-3 w-3" />
              <span>Snapshot Code</span>
            </div>
            <span>TypeScript</span>
          </div>
          <div className="min-h-0 flex-1 overflow-hidden p-4">
            <InterviewEditor
              value={record.userAnswer}
              readOnly
            />
          </div>
        </div>
      }
      analysis={
        <div className="min-h-[14rem] flex-1 overflow-hidden border-sketch bg-white">
          <div className="flex items-center gap-2 border-b border-ink/10 bg-slate-50/30 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-ink">
            <FileText className="h-3.5 w-3.5" />
            AI Evaluation
          </div>
          <div className="h-full overflow-hidden p-6">
            <AnalysisReport evaluation={record.evaluation} />
          </div>
        </div>
      }
      footer={
        <>
          <Button
            variant="outline"
            onClick={() => navigate("/history")}
            className="border-sketch bg-white text-ink hover:text-gold font-bold uppercase tracking-wider text-[10px]"
          >
            Back to List
          </Button>
        </>
      }
    />
  );
}
