import { Loader2, RefreshCcw } from "lucide-react";
import { useCallback, useEffect, useMemo, useReducer } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AnalysisReport } from "@/components/interview/AnalysisReport";
import { InterviewEditor } from "@/components/interview/Editor";
import { MainLayout } from "@/components/interview/MainLayout";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { db, type InterviewBlueprint, type InterviewEvaluation, type InterviewRecord, type InterviewSession } from "@/lib/db";
import { appendBossHistory, evaluateBossAnswer, getNextBossQuestion, ensureDefaultBlueprints, type BossQuestion } from "@/lib/interviewEngine";
import { useRecordStore } from "@/store/useRecordStore";

type Step = "LOADING" | "LOADING_QUESTION" | "ANSWERING" | "ANALYZING" | "RESULT" | "COMPLETED";

const bossDebugEnabled = import.meta.env.DEV;

function bossLog(message: string, payload?: unknown) {
  if (!bossDebugEnabled) return;
  if (typeof console === "undefined") return;
  if (payload === undefined) console.log(`[BOSS:UI] ${message}`);
  else console.log(`[BOSS:UI] ${message}`, payload);
}

type State = {
  step: Step;
  session: InterviewSession | null;
  blueprint: InterviewBlueprint | null;
  question: BossQuestion | null;
  answer: string;
  evaluation: InterviewEvaluation | null;
};

type Action =
  | { type: "SET_LOADED"; session: InterviewSession; blueprint: InterviewBlueprint }
  | { type: "SET_QUESTION"; session: InterviewSession; question: BossQuestion }
  | { type: "SET_STEP"; step: Step }
  | { type: "SET_ANSWER"; answer: string }
  | { type: "SET_EVAL"; evaluation: InterviewEvaluation }
  | { type: "SET_SESSION"; session: InterviewSession };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "SET_LOADED":
      return { ...state, session: action.session, blueprint: action.blueprint };
    case "SET_QUESTION":
      return { ...state, session: action.session, question: action.question, answer: "", evaluation: null };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_ANSWER":
      return { ...state, answer: action.answer };
    case "SET_EVAL":
      return { ...state, evaluation: action.evaluation };
    case "SET_SESSION":
      return { ...state, session: action.session };
    default:
      return state;
  }
}

function calcProgress(session: InterviewSession, blueprint: InterviewBlueprint) {
  const foundationTotal = blueprint.strategy.requiredDomains.reduce((acc, d) => acc + d.minQuestions, 0);
  const deepDiveTotal = 2;
  const algoTotal = 1;
  const total = Math.max(1, foundationTotal + deepDiveTotal + algoTotal);
  const done = session.history.filter((h) => h.kind !== "follow-up").length;
  if (session.status === "completed") return 100;
  return Math.min(99, Math.round((done / total) * 100));
}

export default function InterviewBossSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const addRecord = useRecordStore((s) => s.addRecord);

  const [state, dispatch] = useReducer(reducer, {
    step: "LOADING",
    session: null,
    blueprint: null,
    question: null,
    answer: "",
    evaluation: null,
  });

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!id) return;
      dispatch({ type: "SET_STEP", step: "LOADING" });
      try {
        await ensureDefaultBlueprints();
        const session = await db.sessions.get(id);
        if (!session) throw new Error("Session not found");
        const blueprint = await db.blueprints.get(session.blueprintId);
        if (!blueprint) throw new Error("Blueprint not found");
        if (!mounted) return;
        dispatch({ type: "SET_LOADED", session, blueprint });
        bossLog("Loaded session + blueprint", {
          session: {
            id: session.id,
            blueprintId: session.blueprintId,
            status: session.status,
            currentPhase: session.currentPhase,
            historyLen: session.history.length,
            domainScores: session.domainScores,
          },
          blueprint: { id: blueprint.id, name: blueprint.name },
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        toast.error(message);
        navigate("/boss/setup", { replace: true });
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [id, navigate]);

  const progress = useMemo(() => {
    if (!state.session || !state.blueprint) return 0;
    return calcProgress(state.session, state.blueprint);
  }, [state.blueprint, state.session]);

  const headerRight = useMemo(() => {
    if (!state.session) return null;
    const phase = state.session.currentPhase;
    const status = state.session.status;
    return (
      <div className="flex items-center gap-2">
        <span className="rounded-sm border border-ink px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-ink">
          {phase}
        </span>
        <span
          className={cn(
            "rounded-sm border px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest",
            status === "completed" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {status}
        </span>
      </div>
    );
  }, [state.session]);

  const fetchQuestion = useCallback(async (session: InterviewSession, blueprint: InterviewBlueprint) => {
    bossLog("Fetch next question", { sessionId: session.id, currentPhase: session.currentPhase, historyLen: session.history.length });
    dispatch({ type: "SET_STEP", step: "LOADING_QUESTION" });
    try {
      const next = await getNextBossQuestion({ session, blueprint });
      dispatch({ type: "SET_QUESTION", session: next.session, question: next.question });
      dispatch({ type: "SET_STEP", step: next.session.status === "completed" ? "COMPLETED" : "ANSWERING" });
      bossLog("Next question ready", {
        session: { id: next.session.id, currentPhase: next.session.currentPhase, status: next.session.status, historyLen: next.session.history.length },
        question: {
          id: next.question.id,
          topic: next.question.topic,
          difficulty: next.question.difficulty,
          questionType: next.question.questionType,
          source: next.question.source,
          contentPreview: next.question.content.slice(0, 120),
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      dispatch({ type: "SET_STEP", step: "ANSWERING" });
    }
  }, []);

  useEffect(() => {
    if (!state.session || !state.blueprint) return;
    if (state.question) return;
    void fetchQuestion(state.session, state.blueprint);
  }, [fetchQuestion, state.blueprint, state.question, state.session]);

  const submit = async () => {
    if (!state.session || !state.blueprint || !state.question) return;
    bossLog("Submit answer", { sessionId: state.session.id, questionId: state.question.id, answerLen: state.answer.length });
    dispatch({ type: "SET_STEP", step: "ANALYZING" });
    try {
      const evaluation = await evaluateBossAnswer({
        topic: state.question.topic,
        question: state.question.content,
        userAnswer: state.answer,
      });
      dispatch({ type: "SET_EVAL", evaluation });
      dispatch({ type: "SET_STEP", step: "RESULT" });
      bossLog("Evaluation received", { score: evaluation.score, techTags: evaluation.techTags });

      const record: InterviewRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: state.question.topic,
        sessionId: state.session.id,
        blueprintId: state.session.blueprintId,
        sourceType: state.question.source,
        questionId: state.question.id,
        difficulty: state.question.difficulty,
        questionType: state.question.questionType,
        questionContent: state.question.content,
        userAnswer: state.answer,
        evaluation,
      };
      await addRecord(record);
      bossLog("Record saved", {
        id: record.id,
        topic: record.topic,
        sessionId: record.sessionId,
        blueprintId: record.blueprintId,
        difficulty: record.difficulty,
        questionType: record.questionType,
        sourceType: record.sourceType,
        score: record.evaluation.score,
      });

      const nextSession = await appendBossHistory({
        session: state.session,
        blueprint: state.blueprint,
        question: state.question,
        recordId: record.id,
        score: evaluation.score,
        evaluation,
      });
      dispatch({ type: "SET_SESSION", session: nextSession });
      bossLog("Session updated", {
        id: nextSession.id,
        status: nextSession.status,
        currentPhase: nextSession.currentPhase,
        historyLen: nextSession.history.length,
        domainScores: nextSession.domainScores,
      });
      if (nextSession.status === "completed") dispatch({ type: "SET_STEP", step: "COMPLETED" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`评分失败: ${message}`);
      dispatch({ type: "SET_STEP", step: "ANSWERING" });
    }
  };

  const next = async () => {
    if (!state.session || !state.blueprint) return;
    if (state.session.status === "completed") {
      dispatch({ type: "SET_STEP", step: "COMPLETED" });
      return;
    }
    await fetchQuestion(state.session, state.blueprint);
  };

  return (
    <MainLayout
      title="Interview Boss"
      backTo="/boss/setup"
      backLabel="Setup"
      topicLabel={state.blueprint?.name ?? ""}
      progress={progress}
      isGenerating={state.step === "LOADING_QUESTION" && state.question?.source === "AI"}
      headerRight={
        state.step !== "LOADING" ? (
          <>
            {headerRight}
            <Button
              size="sm"
              variant="outline"
              onClick={next}
              disabled={state.step === "LOADING_QUESTION" || state.step === "ANALYZING" || !state.session || !state.blueprint}
              className="text-[10px] font-bold uppercase tracking-[0.2em] text-ink hover:bg-transparent hover:text-ink/70 hover:underline disabled:opacity-50"
            >
              <RefreshCcw className={cn("mr-2 h-3 w-3", state.step === "LOADING_QUESTION" && "animate-spin")} />
              Next
            </Button>
          </>
        ) : null
      }
      question={
        state.question ? (
          <QuestionCard
            title="Question"
            content={state.question.content}
            difficulty={state.question.difficulty}
            meta={`${state.question.source} · ${state.question.questionType}`}
          />
        ) : (
          <div className="h-full overflow-hidden rounded-sm border border-ink/10 bg-white p-8 text-sm text-ink-light">
            Loading...
          </div>
        )
      }
      editor={
        <div className="flex h-full flex-col gap-4">
          <div className="flex-1 overflow-hidden rounded-sm border border-ink/10 bg-white shadow-sm transition-all hover:shadow-md">
            <InterviewEditor
              value={state.answer}
              onChange={(answer) => dispatch({ type: "SET_ANSWER", answer })}
              disabled={state.step !== "ANSWERING"}
            />
          </div>
        </div>
      }
      analysis={
        state.step === "ANALYZING" || state.evaluation ? (
          <div className="h-full overflow-hidden rounded-sm border border-ink/10 bg-white shadow-sm transition-all hover:shadow-md">
            {state.step === "ANALYZING" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 bg-slate-50/50 text-sm text-slate-600 p-12">
                <Loader2 className="h-6 w-6 animate-spin text-ink" />
                <span className="font-sketch text-lg tracking-wide">Analyzing...</span>
              </div>
            ) : (
              <AnalysisReport evaluation={state.evaluation!} />
            )}
          </div>
        ) : null
      }
      footer={
        state.step === "COMPLETED" ? (
          <>
            <Button
              variant="outline"
              onClick={() => navigate("/history")}
              className="h-12 rounded-none border-ink bg-white px-8 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-all hover:bg-ink hover:text-white"
            >
              View History
            </Button>
            <Button
              onClick={() => navigate("/", { replace: true })}
              className="h-12 rounded-none bg-ink px-8 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-ink/90 hover:shadow-lg"
            >
              Back Home
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={submit}
              disabled={state.step !== "ANSWERING" || !state.question || !state.session || !state.blueprint}
              className="h-12 rounded-none bg-ink px-8 text-xs font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-ink/90 hover:shadow-lg disabled:opacity-50"
            >
              {state.step === "ANALYZING" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                "Submit"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={next}
              disabled={!state.session || !state.blueprint || state.step === "ANALYZING"}
              className="h-12 rounded-none border-ink bg-white px-8 text-xs font-bold uppercase tracking-[0.2em] text-ink transition-all hover:bg-ink hover:text-white disabled:opacity-50"
            >
              Next Question
            </Button>
          </>
        )
      }
    />
  );
}
