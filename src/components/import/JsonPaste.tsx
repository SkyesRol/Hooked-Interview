import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import type { RawInput } from "@/components/import/types";
import { cn } from "@/lib/utils";

function stripJsonFences(raw: string) {
  const trimmed = raw.trim();
  const fenceMatch = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenceMatch) return fenceMatch[1].trim();
  return trimmed;
}

function extractFirstJsonArray(raw: string) {
  const cleaned = stripJsonFences(raw);
  const direct = cleaned.trim();
  if (direct.startsWith("[") && direct.endsWith("]")) return direct;
  const match = cleaned.match(/\[[\s\S]*\]/);
  if (match) return match[0];
  return cleaned;
}

function parseTags(tags: unknown): string[] {
  if (!tags) return [];
  if (Array.isArray(tags)) return tags.map((t) => String(t));
  if (typeof tags === "string") return tags.split(/[,，]/g).map((t) => t.trim());
  return [String(tags)];
}

export default function JsonPaste({ onStage }: { onStage: (rawItems: RawInput[]) => Promise<void> | void }) {
  const [text, setText] = useState("");

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="import-json">JSON Array</Label>
        <textarea
          id="import-json"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className={cn(
            "flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
          )}
          placeholder='例如：[{ "topic": "React", "difficulty": "Medium", "content": "..." , "tags": ["Hooks"] }]'
        />
      </div>

      <div className="flex items-center gap-3">
        <Button
          type="button"
          onClick={async () => {
            const candidate = extractFirstJsonArray(text);
            let parsed: unknown;
            try {
              parsed = JSON.parse(candidate);
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              toast.error(`JSON 解析失败: ${message}`);
              return;
            }

            if (!Array.isArray(parsed)) {
              toast.error("JSON 顶层必须是数组");
              return;
            }

            const rawItems: RawInput[] = parsed.map((item) => {
              const obj = item as Record<string, unknown>;
              const content = typeof obj.content === "string" ? obj.content : typeof obj.question === "string" ? obj.question : "";
              return {
                topic: typeof obj.topic === "string" ? obj.topic : "",
                difficulty: typeof obj.difficulty === "string" ? obj.difficulty : "",
                questionType:
                  typeof obj.type === "string"
                    ? obj.type
                    : typeof obj.questionType === "string"
                      ? obj.questionType
                      : "",
                content,
                tags: parseTags(obj.tags),
                source: "json",
              };
            });

            await onStage(rawItems);
          }}
        >
          解析并加入暂存区
        </Button>
        <Button type="button" variant="outline" onClick={() => setText("")}>
          清空
        </Button>
        <p className="text-sm text-slate-600">支持粘贴带 ```json 围栏的内容，会自动提取第一个数组。</p>
      </div>
    </div>
  );
}
