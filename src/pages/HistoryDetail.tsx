import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Trash2 } from "lucide-react";
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
        <Badge variant={scoreVariant(score)}>{score}</Badge>
        <Button
          variant="outline"
          size="sm"
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
          className={cn("border-red-200 text-red-700 hover:bg-red-50")}
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
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
          正在加载记录...
        </div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto w-full max-w-6xl rounded-xl border border-slate-200 bg-white p-8">
          <h1 className="text-base font-semibold text-slate-950">Record not found</h1>
          <p className="mt-1 text-sm text-slate-600">This history record may have been deleted.</p>
          <div className="mt-6">
            <Button onClick={() => navigate("/history")}>Back to History</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MainLayout
      title="History Review"
      backTo="/history"
      backLabel="历史"
      topicLabel={record.topic}
      progress={score}
      headerRight={headerRight}
      question={
        <div className="h-full overflow-hidden">
          <QuestionCard
            title="Question"
            content={record.questionContent || "（无题目内容）"}
            difficulty={normalizeDifficulty(record.difficulty)}
            meta={record.sourceType ? `${record.sourceType} · ${record.questionType ?? "Code"}` : "Snapshot"}
          />
        </div>
      }
      editor={
        <div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-2 text-xs text-slate-600">
            <span>Snapshot Code</span>
            <span>Language: TypeScript</span>
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
        <div className="min-h-[14rem] flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-950">AI Evaluation</div>
          <div className="h-full overflow-hidden p-4">
            <AnalysisReport evaluation={record.evaluation} />
          </div>
        </div>
      }
      footer={
        <>
          <Button variant="outline" onClick={() => navigate("/history")}>
            返回列表
          </Button>
        </>
      }
    />
  );
}
