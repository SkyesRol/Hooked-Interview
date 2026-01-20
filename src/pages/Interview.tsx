import { Loader2, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useReducer, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { toast } from "sonner";
import { AnalysisReport } from "@/components/interview/AnalysisReport";
import { InterviewEditor } from "@/components/interview/Editor";
import { MainLayout } from "@/components/interview/MainLayout";
import { QuestionCard } from "@/components/interview/QuestionCard";
import { SourceSelectorDialog, type QuestionSource } from "@/components/interview/SourceSelectorDialog";
import { Button } from "@/components/ui/button";
import { type Difficulty, type InterviewEvaluation } from "@/lib/db";
import { evaluateAnswer, generateQuestion } from "@/lib/ai/client";
import { useRecordStore } from "@/store/useRecordStore";
import { useQuestionStore } from "@/store/useQuestionStore";
import { getTechBySlug, TECH_STACKS } from "@/constants/topics";

type InterviewStep = "INIT" | "LOADING_QUESTION" | "ANSWERING" | "ANALYZING" | "RESULT";

type QuestionData = {
  id: string;
  content: string;
  type: string;
  difficulty: Difficulty;
  source: QuestionSource;
};

function normalizeSource(input: unknown): QuestionSource {
  if (input === "AI" || input === "Local") return input;
  return "AI";
}

type CurrentSessionState = {
  step: InterviewStep;
  topic: string;
  source: QuestionSource | null;
  questionData: QuestionData | null;
  userCode: string;
  analysisResult: InterviewEvaluation | null;
};

type Action =
  | { type: "RESET"; topic: string }
  | { type: "SELECT_SOURCE"; source: QuestionSource }
  | { type: "SET_STEP"; step: InterviewStep }
  | { type: "SET_QUESTION"; question: QuestionData }
  | { type: "SET_CODE"; code: string }
  | { type: "SET_ANALYSIS"; analysis: InterviewEvaluation };

function normalizeDifficulty(input: unknown): Difficulty {
  if (input === "Simple" || input === "Medium" || input === "Hard") return input;
  return "Medium";
}

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function normalizeAnalysis(input: unknown): InterviewEvaluation {
  const clamp = (n: unknown, min: number, max: number, fallback: number) => {
    const v = typeof n === "number" && Number.isFinite(n) ? n : fallback;
    return Math.min(max, Math.max(min, v));
  };

  const root = toRecord(input) ?? {};
  const score = Math.round(clamp(root.score, 0, 100, 0));
  const dimensions = toRecord(root.dimensions) ?? {};
  const techTags = Array.isArray(root.techTags)
    ? root.techTags.filter((t): t is string => typeof t === "string" && Boolean(t.trim()))
    : [];
  const comment = typeof root.comment === "string" ? root.comment : "";
  const referenceAnswer = typeof root.referenceAnswer === "string" ? root.referenceAnswer : "";
  return {
    score,
    techTags,
    dimensions: {
      accuracy: clamp(dimensions.accuracy, 0, 10, 0),
      completeness: clamp(dimensions.completeness, 0, 10, 0),
      logic: clamp(dimensions.logic, 0, 10, 0),
      codeQuality: clamp(dimensions.codeQuality, 0, 10, 0),
    },
    comment,
    referenceAnswer,
  };
}

function reducer(state: CurrentSessionState, action: Action): CurrentSessionState {
  switch (action.type) {
    case "RESET":
      return { step: "INIT", topic: action.topic, source: null, questionData: null, userCode: "", analysisResult: null };
    case "SELECT_SOURCE":
      return { ...state, source: action.source };
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_QUESTION":
      return { ...state, questionData: action.question, userCode: "", analysisResult: null };
    case "SET_CODE":
      return { ...state, userCode: action.code };
    case "SET_ANALYSIS":
      return { ...state, analysisResult: action.analysis };
    default:
      return state;
  }
}

export default function Interview() {
  const { topic } = useParams();
  const location = useLocation();
  const addRecord = useRecordStore((s) => s.addRecord);
  const hasAnyQuestions = useQuestionStore((s) => s.hasAnyQuestions);
  const getRandomQuestionByTopic = useQuestionStore((s) => s.getRandomQuestionByTopic);
  const [localEnabled, setLocalEnabled] = useState(false);

  const displayTopic = useMemo(() => {
    if (!topic) return "";
    const decoded = decodeURIComponent(topic);
    const bySlug = getTechBySlug(decoded.toLowerCase());
    if (bySlug) return bySlug.label;
    const byLabel = TECH_STACKS.find((t) => t.label.toLowerCase() === decoded.toLowerCase());
    return byLabel ? byLabel.label : decoded;
  }, [topic]);

  const [state, dispatch] = useReducer(reducer, {
    step: "INIT",
    topic: displayTopic,
    source: null,
    questionData: null,
    userCode: "",
    analysisResult: null,
  });

  const retryQuestion = useMemo(() => {
    const root = toRecord(location.state);
    if (!root || root.retryMode !== true) return null;
    const fixed = toRecord(root.fixedQuestion);
    if (!fixed) return null;
    const content = fixed.content;
    if (typeof content !== "string" || !content.trim()) return null;
    const q: QuestionData = {
      id: typeof fixed.id === "string" ? fixed.id : crypto.randomUUID(),
      content,
      type: typeof fixed.type === "string" ? fixed.type : "Code",
      difficulty: normalizeDifficulty(fixed.difficulty),
      source: normalizeSource(fixed.source),
    };
    return q;
  }, [location.state]);

  useEffect(() => {
    dispatch({ type: "RESET", topic: displayTopic });
    if (!retryQuestion) return;
    dispatch({ type: "SELECT_SOURCE", source: retryQuestion.source });
    dispatch({ type: "SET_QUESTION", question: retryQuestion });
    dispatch({ type: "SET_STEP", step: "ANSWERING" });
  }, [displayTopic, retryQuestion]);

  useEffect(() => {
    let mounted = true;
    hasAnyQuestions().then((enabled) => {
      if (!mounted) return;
      setLocalEnabled(enabled);
    });
    return () => {
      mounted = false;
    };
  }, [hasAnyQuestions]);

  const progress = useMemo(() => {
    const map: Record<InterviewStep, number> = {
      INIT: 0,
      LOADING_QUESTION: 25,
      ANSWERING: 50,
      ANALYZING: 75,
      RESULT: 100,
    };
    return map[state.step];
  }, [state.step]);

  const fetchQuestion = async (source: QuestionSource) => {
    dispatch({ type: "SET_STEP", step: "LOADING_QUESTION" });
    try {
      if (source === "AI") {
        const generated = await generateQuestion(displayTopic || "Frontend");
        const q: QuestionData = {
          id: crypto.randomUUID(),
          content: generated.question,
          type: generated.type,
          difficulty: normalizeDifficulty(generated.difficulty),
          source: "AI",
        };
        dispatch({ type: "SET_QUESTION", question: q });
        dispatch({ type: "SET_STEP", step: "ANSWERING" });
        return;
      }

      const picked = await getRandomQuestionByTopic(displayTopic);
      if (!picked) throw new Error("本地题库为空或当前 Topic 无题目");
      const q: QuestionData = {
        id: picked.id,
        content: picked.content,
        type: "Local",
        difficulty: picked.difficulty,
        source: "Local",
      };
      dispatch({ type: "SET_QUESTION", question: q });
      dispatch({ type: "SET_STEP", step: "ANSWERING" });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
      dispatch({ type: "SET_STEP", step: "INIT" });
    }
  };

  const handleSelectSource = async (source: QuestionSource) => {
    dispatch({ type: "SELECT_SOURCE", source });
    await fetchQuestion(source);
  };

  const handleSubmit = async () => {
    if (!state.questionData) return;
    dispatch({ type: "SET_STEP", step: "ANALYZING" });
    try {
      const result = await evaluateAnswer({
        topic: displayTopic || "Frontend",
        question: state.questionData.content,
        userAnswer: state.userCode,
      });
      const evaluation = normalizeAnalysis(result);
      dispatch({ type: "SET_ANALYSIS", analysis: evaluation });
      dispatch({ type: "SET_STEP", step: "RESULT" });

      await addRecord({
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        topic: displayTopic || "Frontend",
        sourceType: state.questionData.source,
        questionId: state.questionData.id,
        difficulty: state.questionData.difficulty,
        questionType: state.questionData.type,
        questionContent: state.questionData.content,
        userAnswer: state.userCode,
        evaluation,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      toast.error(`评分失败: ${message}`);
      dispatch({ type: "SET_STEP", step: "ANSWERING" });
    }
  };

  const handleNext = async () => {
    if (!state.source) {
      dispatch({ type: "SET_STEP", step: "INIT" });
      return;
    }
    await fetchQuestion(state.source);
  };

  return (
    <>
      <SourceSelectorDialog open={state.step === "INIT"} localEnabled={localEnabled} onSelect={handleSelectSource} />

      <MainLayout
        topicLabel={displayTopic}
        progress={progress}
        headerRight={
          state.step === "ANSWERING" || state.step === "RESULT" ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleNext}
              disabled={state.step === "ANSWERING" && !state.questionData}
            >
              <RefreshCcw className="h-4 w-4" />
              换一题
            </Button>
          ) : null
        }
        question={
          <QuestionCard
            title={state.questionData ? "Question" : "Question"}
            content={
              state.questionData?.content ||
              "请先选择出题来源开始面试。\n\n- AI 出题：实时生成题目并评分\n- 本地题库：从 IndexedDB 随机抽题"
            }
            difficulty={state.questionData?.difficulty ?? "Medium"}
            meta={state.questionData ? `${state.questionData.source} · ${state.questionData.type}` : undefined}
          />
        }
        workspace={
          <div className="flex h-full flex-col gap-4 overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <InterviewEditor
                value={state.userCode}
                onChange={(code) => dispatch({ type: "SET_CODE", code })}
                disabled={state.step !== "ANSWERING"}
              />
            </div>
            <div className="min-h-[14rem] flex-1 overflow-hidden">
              {state.step === "ANALYZING" ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  正在分析评分...
                </div>
              ) : state.analysisResult ? (
                <AnalysisReport evaluation={state.analysisResult} />
              ) : (
                <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white text-sm text-slate-600">
                  提交后在此展示评分报告
                </div>
              )}
            </div>
          </div>
        }
        footer={
          <>
            <Button onClick={handleSubmit} disabled={state.step !== "ANSWERING" || !state.questionData}>
              {state.step === "ANALYZING" ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  提交回答
                </>
              ) : (
                "提交回答"
              )}
            </Button>
            <Button variant="outline" onClick={handleNext} disabled={!state.source || state.step === "ANALYZING"}>
              下一题
            </Button>
          </>
        }
      />
    </>
  );
}
