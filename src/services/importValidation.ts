import type { Difficulty, QuestionType } from "@/lib/db";
import type { ExistingQuestion, RawInput, StagedItem } from "@/components/import/types";

const ALLOWED_DIFFICULTIES = ["Simple", "Medium", "Hard"] as const;
const ALLOWED_QUESTION_TYPES = ["Code", "Theory", "SystemDesign"] as const;

function normalizeText(value: string) {
  return value.trim().replace(/\r\n/g, "\n");
}

function normalizeTags(tags: string[] | undefined) {
  if (!tags?.length) return [];
  const unique = new Set<string>();
  for (const t of tags) {
    const normalized = t.trim();
    if (!normalized) continue;
    unique.add(normalized);
  }
  return Array.from(unique);
}

function coerceDifficulty(raw: string): Difficulty | null {
  const trimmed = raw.trim();
  if ((ALLOWED_DIFFICULTIES as readonly string[]).includes(trimmed)) return trimmed as Difficulty;
  return null;
}

function coerceQuestionType(raw: unknown): QuestionType | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if ((ALLOWED_QUESTION_TYPES as readonly string[]).includes(trimmed)) return trimmed as QuestionType;
  return null;
}

function makeDedupeKey(topic: string, content: string) {
  return `${normalizeText(topic)}::${normalizeText(content)}`;
}

export async function computeContentHash(topic: string, content: string) {
  const input = makeDedupeKey(topic, content);
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function validateAndCheckDuplicates(rawItems: RawInput[], existingQuestions: ExistingQuestion[]) {
  const existingKeySet = new Set(existingQuestions.map((q) => makeDedupeKey(q.topic, q.content)));

  const results: StagedItem[] = [];
  for (const raw of rawItems) {
    const topic = normalizeText(raw.topic);
    const content = normalizeText(raw.content);
    const difficulty = coerceDifficulty(raw.difficulty);
    const questionType = coerceQuestionType(raw.questionType) ?? "Code";
    const tags = normalizeTags(raw.tags);

    if (!topic) {
      results.push({
        _tempId: crypto.randomUUID(),
        status: "error",
        errorMsg: "缺少 topic",
        source: raw.source,
        payload: { topic: "", difficulty: "Medium", questionType, content, tags },
      });
      continue;
    }

    if (!content) {
      results.push({
        _tempId: crypto.randomUUID(),
        status: "error",
        errorMsg: "缺少 content",
        source: raw.source,
        payload: { topic, difficulty: "Medium", questionType, content: "", tags },
      });
      continue;
    }

    if (!difficulty) {
      results.push({
        _tempId: crypto.randomUUID(),
        status: "error",
        errorMsg: `difficulty 仅支持 ${ALLOWED_DIFFICULTIES.join(" / ")}`,
        source: raw.source,
        payload: { topic, difficulty: "Medium", questionType, content, tags },
      });
      continue;
    }

    const key = makeDedupeKey(topic, content);
    if (existingKeySet.has(key)) {
      results.push({
        _tempId: crypto.randomUUID(),
        status: "duplicate",
        source: raw.source,
        payload: { topic, difficulty, questionType, content, tags },
      });
      continue;
    }

    existingKeySet.add(key);
    results.push({
      _tempId: crypto.randomUUID(),
      status: "valid",
      source: raw.source,
      payload: { topic, difficulty, questionType, content, tags },
    });
  }

  return results;
}
