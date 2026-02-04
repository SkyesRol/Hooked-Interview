import { evaluateAnswer, generateFollowUpQuestion, generateQuestion } from "@/lib/ai/client";
import { db, type Difficulty, type InterviewBlueprint, type InterviewEvaluation, type InterviewSession, type QuestionItem, type QuestionType } from "@/lib/db";
import { resolveTech } from "@/constants/topics";

type BossPhase = InterviewSession["currentPhase"];

const bossDebugEnabled = import.meta.env.DEV;

function bossLog(message: string, payload?: unknown) {
  if (!bossDebugEnabled) return;
  if (typeof console === "undefined") return;
  if (payload === undefined) console.log(`[BOSS] ${message}`);
  else console.log(`[BOSS] ${message}`, payload);
}

export type BossQuestion = {
  id: string;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  content: string;
  source: "AI" | "Local";
  followUp?: { rootRecordId: string; depth: number };
};

function toRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  if (Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function normalizeEvaluation(input: unknown): InterviewEvaluation {
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

function clampDifficultyWithinRange(d: Difficulty, range: [Difficulty, Difficulty]): Difficulty {
  const order: Difficulty[] = ["Simple", "Medium", "Hard"];
  const idx = (x: Difficulty) => order.indexOf(x);
  const min = Math.min(idx(range[0]), idx(range[1]));
  const max = Math.max(idx(range[0]), idx(range[1]));
  const v = idx(d);
  return order[Math.min(max, Math.max(min, v))] ?? "Medium";
}

function bumpDifficulty(d: Difficulty): Difficulty {
  if (d === "Simple") return "Medium";
  if (d === "Medium") return "Hard";
  return "Hard";
}

function pickQuestionType(phase: BossPhase): QuestionType {
  if (phase === "algo") return "Coding";
  return "Concept";
}

function scoreToGoodWeak(score: number) {
  return score >= 75 ? "good" : "weak";
}

function isMainHistoryItem(item: InterviewSession["history"][number]) {
  return item.kind !== "follow-up";
}

function mainHistory(session: InterviewSession) {
  return session.history.filter(isMainHistoryItem);
}

function pickNextDeepDiveTopic(args: { session: InterviewSession; blueprint: InterviewBlueprint }) {
  const topics =
    args.session.selectedFrameworks.length > 0
      ? args.session.selectedFrameworks
      : args.blueprint.strategy.electiveDomains.map((d) => d.topic).filter(Boolean);

  const counts = new Map<string, number>();
  for (const t of topics) counts.set(t, 0);
  for (const h of mainHistory(args.session)) {
    if (!counts.has(h.topic)) continue;
    counts.set(h.topic, (counts.get(h.topic) ?? 0) + 1);
  }

  const sorted = [...topics].sort((a, b) => {
    const ca = counts.get(a) ?? 0;
    const cb = counts.get(b) ?? 0;
    if (ca !== cb) return ca - cb;
    return a.localeCompare(b);
  });

  return {
    topics,
    counts: Object.fromEntries([...counts.entries()]),
    chosen: sorted[0] ?? topics[0] ?? "React",
  };
}

async function listQuestionsByTopic(topic: string) {
  const resolved = resolveTech(topic);
  if (!resolved) {
    const list = await db.questions.where("topic").equals(topic).toArray();
    bossLog("Query questions by topic", { input: topic, resolved: null, matchedTopics: [topic], count: list.length });
    return list;
  }
  const matchedTopics = [resolved.slug, resolved.label];
  const list = await db.questions.where("topic").anyOf(matchedTopics).toArray();
  bossLog("Query questions by topic", {
    input: topic,
    resolved: { slug: resolved.slug, label: resolved.label },
    matchedTopics,
    count: list.length,
  });
  return list;
}

function normalizeQuestionType(input: unknown): QuestionType | null {
  if (input === "Coding" || input === "Concept" || input === "Design" || input === "Scenario") return input;
  return null;
}

async function pickLocalQuestion(args: {
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
  excludeIds: Set<string>;
}): Promise<QuestionItem | null> {
  const list = await listQuestionsByTopic(args.topic);
  const excludedCount = list.reduce((acc, q) => acc + (args.excludeIds.has(q.id) ? 1 : 0), 0);
  const byDifficulty = list.reduce<Record<Difficulty, number>>(
    (acc, q) => {
      acc[q.difficulty] += 1;
      return acc;
    },
    { Simple: 0, Medium: 0, Hard: 0 },
  );
  const byType = list.reduce<Record<string, number>>((acc, q) => {
    const key = normalizeQuestionType(q.questionType) ?? "Concept(default)";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});

  bossLog("Local filter start", {
    topic: args.topic,
    criteria: { difficulty: args.difficulty, questionType: args.questionType },
    excludeIdsCount: args.excludeIds.size,
    totalInTopic: list.length,
    excludedInTopic: excludedCount,
    byDifficulty,
    byType,
  });

  const pool = list.filter((q) => {
    if (args.excludeIds.has(q.id)) return false;
    const type = normalizeQuestionType(q.questionType) ?? "Concept";
    return q.difficulty === args.difficulty && type === args.questionType;
  });
  bossLog("Local filter result", {
    topic: args.topic,
    criteria: { difficulty: args.difficulty, questionType: args.questionType },
    poolSize: pool.length,
    sampleIds: pool.slice(0, 5).map((q) => q.id),
  });
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

export async function ensureDefaultBlueprints() {
  const count = await db.blueprints.count();
  if (count > 0) return;

  const followUpStrategy: InterviewBlueprint["strategy"]["followUpStrategy"] = {
    enabled: true,
    remedial: { triggerBelowScore: 75, stopAtOrAboveScore: 75, max: 2 },
    deepen: { triggerAtOrAboveScore: 90, continueAtOrAboveScore: 75, max: 1 },
    focus: { includeWeakestDimension: true, includeTechTags: true },
  };

  const blueprints: InterviewBlueprint[] = [
    {
      id: "campus-2025-vue",
      name: "Campus 2025 · Vue",
      strategy: {
        requiredDomains: [
          { topic: "JavaScript", levelRange: ["Simple", "Medium"], minQuestions: 2 },
          { topic: "TypeScript", levelRange: ["Simple", "Medium"], minQuestions: 1 },
          { topic: "Browser", levelRange: ["Simple", "Medium"], minQuestions: 2 },
          { topic: "Network", levelRange: ["Simple", "Medium"], minQuestions: 1 },
        ],
        electiveDomains: [{ topic: "Vue", weight: 1, allowDeepDive: true }],
        redLines: ["XSS Awareness", "CSP"],
        followUpStrategy,
      },
    },
    {
      id: "campus-2025-react",
      name: "Campus 2025 · React",
      strategy: {
        requiredDomains: [
          { topic: "JavaScript", levelRange: ["Simple", "Medium"], minQuestions: 2 },
          { topic: "TypeScript", levelRange: ["Simple", "Medium"], minQuestions: 1 },
          { topic: "Browser", levelRange: ["Simple", "Medium"], minQuestions: 2 },
          { topic: "Network", levelRange: ["Simple", "Medium"], minQuestions: 1 },
        ],
        electiveDomains: [{ topic: "React", weight: 1, allowDeepDive: true }],
        redLines: ["XSS Awareness", "CSP"],
        followUpStrategy,
      },
    },
  ];

  await db.blueprints.bulkPut(blueprints);
  bossLog("Seeded default blueprints", blueprints.map((b) => ({ id: b.id, name: b.name })));
}

export async function createBossSession(args: { blueprintId: string; candidateName: string; selectedFrameworks: string[] }) {
  const session: InterviewSession = {
    id: crypto.randomUUID(),
    blueprintId: args.blueprintId,
    candidateName: args.candidateName.trim() || "Candidate",
    startTime: Date.now(),
    status: "active",
    currentPhase: "foundation",
    selectedFrameworks: args.selectedFrameworks,
    history: [],
    domainScores: {},
  };
  await db.sessions.put(session);
  bossLog("Created session", {
    id: session.id,
    blueprintId: session.blueprintId,
    candidateName: session.candidateName,
    currentPhase: session.currentPhase,
    selectedFrameworks: session.selectedFrameworks,
  });
  return session;
}

export async function loadBossSession(sessionId: string) {
  const session = await db.sessions.get(sessionId);
  if (!session) throw new Error("Session not found");
  return session;
}

function calcAvgScore(session: InterviewSession, topics: string[]) {
  const picked = mainHistory(session).filter((h) => topics.includes(h.topic));
  if (picked.length === 0) return 0;
  const sum = picked.reduce((acc, h) => acc + h.score, 0);
  return Math.round(sum / picked.length);
}

function shouldEnterDeepDive(session: InterviewSession, blueprint: InterviewBlueprint) {
  const topics = blueprint.strategy.requiredDomains.map((d) => d.topic);
  const avg = calcAvgScore(session, topics);
  return avg >= 80;
}

export async function decideNextTarget(session: InterviewSession, blueprint: InterviewBlueprint): Promise<{
  phase: BossPhase;
  topic: string;
  difficulty: Difficulty;
  questionType: QuestionType;
}> {
  const main = mainHistory(session);
  const last = main.length > 0 ? main[main.length - 1] : null;
  const lastOutcome = last ? scoreToGoodWeak(last.score) : null;

  const topicCounts = new Map<string, number>();
  for (const h of main) topicCounts.set(h.topic, (topicCounts.get(h.topic) ?? 0) + 1);

  if (session.currentPhase === "foundation") {
    for (const domain of blueprint.strategy.requiredDomains) {
      const asked = topicCounts.get(domain.topic) ?? 0;
      if (asked >= domain.minQuestions) continue;
      const base: Difficulty = "Simple";
      const bumpBecauseLastGood = Boolean(last && last.topic === domain.topic && lastOutcome === "good");
      const next = bumpBecauseLastGood ? bumpDifficulty(base) : base;
      const target: { phase: BossPhase; topic: string; difficulty: Difficulty; questionType: QuestionType } = {
        phase: "foundation",
        topic: domain.topic,
        difficulty: clampDifficultyWithinRange(next, domain.levelRange),
        questionType: pickQuestionType("foundation"),
      };
      bossLog("Decide next target", {
        sessionId: session.id,
        currentPhase: session.currentPhase,
        historyLen: session.history.length,
        last: last
          ? { topic: last.topic, score: last.score, difficulty: last.difficulty, questionType: last.questionType }
          : null,
        lastOutcome,
        requiredProgress: blueprint.strategy.requiredDomains.map((d) => ({
          topic: d.topic,
          asked: topicCounts.get(d.topic) ?? 0,
          minQuestions: d.minQuestions,
          levelRange: d.levelRange,
        })),
        bumpBecauseLastGood,
        chosen: target,
      });
      return target;
    }

    const nextPhase: BossPhase = shouldEnterDeepDive(session, blueprint) ? "deep-dive" : "algo";
    bossLog("Foundation done, switching phase", { sessionId: session.id, from: session.currentPhase, to: nextPhase });
    return decideNextTarget({ ...session, currentPhase: nextPhase }, blueprint);
  }

  if (session.currentPhase === "deep-dive") {
    const picked = pickNextDeepDiveTopic({ session, blueprint });
    const topic = picked.chosen;
    const baseline: Difficulty = "Medium";
    const lastInTopic = [...session.history].reverse().find((h) => h.topic === topic);
    const lastInTopicOutcome = lastInTopic ? scoreToGoodWeak(lastInTopic.score) : null;
    const bumpBecauseLastInTopicGood = Boolean(lastInTopic && lastInTopicOutcome === "good");
    const bumped = bumpBecauseLastInTopicGood ? bumpDifficulty(baseline) : baseline;
    const target: { phase: BossPhase; topic: string; difficulty: Difficulty; questionType: QuestionType } = {
      phase: "deep-dive",
      topic,
      difficulty: bumped,
      questionType: pickQuestionType("deep-dive"),
    };
    bossLog("Decide next target", {
      sessionId: session.id,
      currentPhase: session.currentPhase,
      historyLen: session.history.length,
      last: last ? { topic: last.topic, score: last.score } : null,
      lastOutcome,
      deepDive: {
        topics: picked.topics,
        counts: picked.counts,
        chosenTopic: picked.chosen,
        lastInTopic: lastInTopic ? { topic: lastInTopic.topic, score: lastInTopic.score } : null,
        lastInTopicOutcome,
        bumpBecauseLastInTopicGood,
      },
      chosen: target,
    });
    return target;
  }

  const topic = "Algorithms";
  const target: { phase: BossPhase; topic: string; difficulty: Difficulty; questionType: QuestionType } = {
    phase: "algo",
    topic,
    difficulty: "Medium",
    questionType: "Coding",
  };
  bossLog("Decide next target", {
    sessionId: session.id,
    currentPhase: session.currentPhase,
    historyLen: session.history.length,
    chosen: target,
  });
  return target;
}

export async function getNextBossQuestion(args: { session: InterviewSession; blueprint: InterviewBlueprint }) {
  if (
    args.session.status !== "completed" &&
    args.session.pendingFollowUp &&
    args.session.currentPhase !== "algo" &&
    args.session.pendingFollowUp.asked < args.session.pendingFollowUp.max
  ) {
    const plan = args.session.pendingFollowUp;
    const record = await db.records.get(plan.lastRecordId);
    if (!record) {
      const session = { ...args.session, pendingFollowUp: undefined };
      await db.sessions.put(session);
      bossLog("Follow-up record missing, clearing plan", { sessionId: session.id, plan });
      return getNextBossQuestion({ session, blueprint: args.blueprint });
    }

    const nextDepth = plan.asked + 1;
    const followUpId = `follow-up:${plan.rootRecordId}:${nextDepth}`;
    const parentItem =
      typeof record.questionId === "string" && record.questionId
        ? await db.questions.get(record.questionId).catch(() => undefined)
        : undefined;
    const template =
      nextDepth === 1 && parentItem?.relationships?.followUp
        ? record.evaluation.score >= 75
          ? parentItem.relationships.followUp.ifCorrect
          : parentItem.relationships.followUp.ifWrong
        : "";

    if (typeof template === "string" && template.trim()) {
      bossLog("Using local follow-up template", { sessionId: args.session.id, followUpId, nextDepth, mode: plan.mode });
      return {
        session: args.session,
        question: {
          id: followUpId,
          topic: plan.topic,
          difficulty: record.difficulty ?? "Medium",
          questionType: (record.questionType as QuestionType) ?? "Concept",
          content: template,
          source: "Local" as const,
          followUp: { rootRecordId: plan.rootRecordId, depth: nextDepth },
        },
      };
    }

    const focusCfg = args.blueprint.strategy.followUpStrategy?.focus ?? { includeWeakestDimension: true, includeTechTags: true };
    const dims = record.evaluation.dimensions;
    const weakest = focusCfg.includeWeakestDimension
      ? [
        { key: "accuracy", score: dims.accuracy },
        { key: "completeness", score: dims.completeness },
        { key: "logic", score: dims.logic },
        { key: "codeQuality", score: dims.codeQuality },
      ].sort((a, b) => a.score - b.score)[0]?.key
      : null;
    const focusPieces = [
      weakest ? `weakest=${weakest}` : "",
      focusCfg.includeTechTags && record.evaluation.techTags.length > 0 ? `tags=${record.evaluation.techTags.join(",")}` : "",
    ].filter(Boolean);
    const focus = focusPieces.length > 0 ? focusPieces.join(" | ") : "target the key gap";

    try {
      const generated = await generateFollowUpQuestion({
        topic: plan.topic,
        parentQuestion: record.questionContent,
        parentAnswer: record.userAnswer,
        evaluation: record.evaluation,
        mode: plan.mode,
        focus,
        depth: nextDepth,
        maxDepth: plan.max,
      });

      const stopBySuggestion = generated.stopAfterThis === true && nextDepth < plan.max;
      if (stopBySuggestion) {
        const session: InterviewSession = { ...args.session, pendingFollowUp: { ...plan, max: nextDepth } };
        await db.sessions.put(session);
        bossLog("Applied AI stop suggestion to follow-up plan", { sessionId: session.id, followUpId, stopReason: generated.stopReason });
        return {
          session,
          question: {
            id: followUpId,
            topic: plan.topic,
            difficulty: record.difficulty ?? "Medium",
            questionType: (record.questionType as QuestionType) ?? "Concept",
            content: generated.question,
            source: "AI" as const,
            followUp: { rootRecordId: plan.rootRecordId, depth: nextDepth },
          },
        };
      }

      bossLog("Generated follow-up question", { sessionId: args.session.id, followUpId, nextDepth, mode: plan.mode, focus, ai: generated });
      return {
        session: args.session,
        question: {
          id: followUpId,
          topic: plan.topic,
          difficulty: record.difficulty ?? "Medium",
          questionType: (record.questionType as QuestionType) ?? "Concept",
          content: generated.question,
          source: "AI" as const,
          followUp: { rootRecordId: plan.rootRecordId, depth: nextDepth },
        },
      };
    } catch (err) {
      const session = { ...args.session, pendingFollowUp: undefined };
      await db.sessions.put(session);
      bossLog("Follow-up generation failed, clearing plan", { sessionId: session.id, error: err instanceof Error ? err.message : String(err) });
      return getNextBossQuestion({ session, blueprint: args.blueprint });
    }
  }

  const target = await decideNextTarget(args.session, args.blueprint);
  let session = args.session;
  if (target.phase !== args.session.currentPhase) {
    session = { ...args.session, currentPhase: target.phase };
    await db.sessions.put(session);
    bossLog("Persisted phase update", { sessionId: session.id, currentPhase: session.currentPhase });
  }
  const excludeIds = new Set(session.history.map((h) => h.questionId));
  const local = await pickLocalQuestion({
    topic: target.topic,
    difficulty: target.difficulty,
    questionType: target.questionType,
    excludeIds,
  });

  if (local) {
    bossLog("Picked local question", {
      sessionId: session.id,
      target,
      question: {
        id: local.id,
        topic: local.topic,
        difficulty: local.difficulty,
        questionType: local.questionType ?? "Concept",
        contentPreview: local.content.slice(0, 120),
      },
    });
    return {
      session,
      question: {
        id: local.id,
        topic: target.topic,
        difficulty: target.difficulty,
        questionType: target.questionType,
        content: local.content,
        source: "Local" as const,
      },
    };
  }

  bossLog("No local match, generating question with constraints", { sessionId: session.id, target });
  const generated = await generateQuestion(target.topic, { difficulty: target.difficulty, type: target.questionType });
  bossLog("Generated question", {
    sessionId: session.id,
    target,
    questionPreview: generated.question.slice(0, 120),
  });
  return {
    session,
    question: {
      id: crypto.randomUUID(),
      topic: target.topic,
      difficulty: target.difficulty,
      questionType: target.questionType,
      content: generated.question,
      source: "AI" as const,
    },
  };
}

export async function evaluateBossAnswer(args: { topic: string; question: string; userAnswer: string }) {
  bossLog("Evaluate answer", { topic: args.topic, questionPreview: args.question.slice(0, 120), answerLen: args.userAnswer.length });
  const raw = await evaluateAnswer(args);
  const normalized = normalizeEvaluation(raw);
  bossLog("Evaluation result", { score: normalized.score, techTags: normalized.techTags, dimensions: normalized.dimensions });
  return normalized;
}

export async function appendBossHistory(args: {
  session: InterviewSession;
  blueprint: InterviewBlueprint;
  question: BossQuestion;
  recordId: string;
  score: number;
  evaluation: InterviewEvaluation;
}) {
  const kind: "main" | "follow-up" = args.question.followUp ? "follow-up" : "main";
  const next: InterviewSession = {
    ...args.session,
    history: [
      ...args.session.history,
      {
        recordId: args.recordId,
        questionId: args.question.id,
        topic: args.question.topic,
        difficulty: args.question.difficulty,
        questionType: args.question.questionType,
        score: args.score,
        timestamp: Date.now(),
        kind,
        rootRecordId: args.question.followUp?.rootRecordId,
      },
    ],
  };

  const topicScores = next.history.filter((h) => h.topic === args.question.topic).map((h) => h.score);
  const avg = topicScores.length === 0 ? 0 : Math.round(topicScores.reduce((a, b) => a + b, 0) / topicScores.length);
  next.domainScores = { ...next.domainScores, [args.question.topic]: avg };

  const followUpConfig = args.blueprint.strategy.followUpStrategy;
  const followUpEnabled = followUpConfig?.enabled !== false;
  const remedialCfg = followUpConfig?.remedial ?? { triggerBelowScore: 75, stopAtOrAboveScore: 75, max: 2 };
  const deepenCfg = followUpConfig?.deepen ?? { triggerAtOrAboveScore: 90, continueAtOrAboveScore: 75, max: 1 };

  if (args.session.pendingFollowUp && kind === "follow-up") {
    const plan = args.session.pendingFollowUp;
    const asked = plan.asked + 1;
    const shouldContinue =
      (plan.mode === "remedial" && args.evaluation.score < remedialCfg.stopAtOrAboveScore && asked < plan.max) ||
      (plan.mode === "deepen" && args.evaluation.score >= deepenCfg.continueAtOrAboveScore && asked < plan.max);
    next.pendingFollowUp = shouldContinue ? { ...plan, asked, lastRecordId: args.recordId } : undefined;
    bossLog("Follow-up plan update after answer", {
      sessionId: next.id,
      plan: { ...plan, askedBefore: plan.asked, askedAfter: asked, shouldContinue },
      score: args.evaluation.score,
    });
  } else if (followUpEnabled && !args.session.pendingFollowUp && kind === "main" && next.currentPhase !== "algo") {
    const baseMode: "remedial" | "deepen" | null =
      args.evaluation.score < remedialCfg.triggerBelowScore
        ? "remedial"
        : next.currentPhase === "deep-dive" && args.evaluation.score >= deepenCfg.triggerAtOrAboveScore
          ? "deepen"
          : null;
    let mode = baseMode;
    let max = baseMode === "remedial" ? remedialCfg.max : baseMode === "deepen" ? deepenCfg.max : 0;

    if (args.question.source === "Local") {
      const item = await db.questions.get(args.question.id).catch(() => undefined);
      const tpl = item?.relationships?.followUp;
      if (tpl && (tpl.ifCorrect?.trim() || tpl.ifWrong?.trim())) {
        mode = args.evaluation.score >= remedialCfg.stopAtOrAboveScore ? "deepen" : "remedial";
        max = 1;
      }
    }

    if (mode) {
      next.pendingFollowUp = {
        rootRecordId: args.recordId,
        lastRecordId: args.recordId,
        topic: args.question.topic,
        phase: next.currentPhase,
        mode,
        asked: 0,
        max,
      };
      bossLog("Scheduled follow-up plan", { sessionId: next.id, plan: next.pendingFollowUp, score: args.evaluation.score, phase: next.currentPhase });
    }
  }

  if (next.currentPhase === "algo" && args.question.topic === "Algorithms") {
    next.status = "completed";
  }

  await db.sessions.put(next);
  bossLog("Appended session history", {
    sessionId: next.id,
    status: next.status,
    currentPhase: next.currentPhase,
    appended: {
      recordId: args.recordId,
      questionId: args.question.id,
      topic: args.question.topic,
      difficulty: args.question.difficulty,
      questionType: args.question.questionType,
      score: args.score,
    },
    domainScores: next.domainScores,
    historyLen: next.history.length,
  });
  return next;
}
