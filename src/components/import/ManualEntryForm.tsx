import { useMemo, useState } from "react";
import { TECH_STACKS } from "@/constants/topics";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RawInput } from "@/components/import/types";
import { cn } from "@/lib/utils";

const DIFFICULTY_OPTIONS = ["Simple", "Medium", "Hard"] as const;
const QUESTION_TYPE_OPTIONS = ["Coding", "Concept", "Design", "Scenario"] as const;

function parseTags(raw: string) {
  return raw
    .split(/[,，]/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

export default function ManualEntryForm({ onStage }: { onStage: (rawItems: RawInput[]) => Promise<void> | void }) {
  const defaultTopic = useMemo(() => (TECH_STACKS[0]?.slug ? String(TECH_STACKS[0].slug) : ""), []);
  const [topic, setTopic] = useState(defaultTopic);
  const [difficulty, setDifficulty] = useState<(typeof DIFFICULTY_OPTIONS)[number]>("Medium");
  const [questionType, setQuestionType] = useState<(typeof QUESTION_TYPE_OPTIONS)[number]>("Coding");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="import-topic">Topic</Label>
          <select
            id="import-topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className={cn(
              "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
          >
            {TECH_STACKS.map((t) => (
              <option key={t.slug} value={t.slug}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="import-difficulty">Difficulty</Label>
          <select
            id="import-difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as (typeof DIFFICULTY_OPTIONS)[number])}
            className={cn(
              "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
          >
            {DIFFICULTY_OPTIONS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="import-type">Type</Label>
          <select
            id="import-type"
            value={questionType}
            onChange={(e) => setQuestionType(e.target.value as (typeof QUESTION_TYPE_OPTIONS)[number])}
            className={cn(
              "flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
            )}
          >
            {QUESTION_TYPE_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="import-content">Content (Markdown)</Label>
        <textarea
          id="import-content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={8}
          className={cn(
            "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
          )}
          placeholder="题干内容，支持 Markdown"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="import-tags">Tags (逗号分隔)</Label>
        <Input
          id="import-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Hooks, Virtual DOM, Performance"
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={async () => {
            await onStage([
              { topic, difficulty, questionType, content, tags: parseTags(tags), source: "manual" },
            ]);
            setContent("");
            setTags("");
          }}
        >
          加入暂存区
        </Button>
        <p className="text-sm text-slate-600">加入后会先进行字段校验与精确去重（topic + content）。</p>
      </div>
    </div>
  );
}
