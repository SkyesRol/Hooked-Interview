import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, PenTool, Save, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TECH_STACKS, normalizeTopicSlug } from "@/constants/topics";
import { db, type Difficulty, type QuestionItem, type QuestionType } from "@/lib/db";
import { cn } from "@/lib/utils";
import { computeContentHash } from "@/services/importValidation";

const questionFormSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  questionType: z.enum(["Coding", "Concept", "Design", "Scenario"]),
  difficulty: z.enum(["Simple", "Medium", "Hard"]),
  content: z.string().min(10, "Question content must be at least 10 characters"),
  tags: z.array(z.string()).max(5, "Max 5 tags allowed"),
  source: z.enum(["user-import", "ai-saved"]).optional(),
});

type QuestionFormValues = z.infer<typeof questionFormSchema>;

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

export default function QuestionEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tagDraft, setTagDraft] = useState("");
  const [sourceLabel, setSourceLabel] = useState<QuestionItem["source"] | null>(null);

  const defaultTopic = useMemo(() => (TECH_STACKS[0]?.slug ? String(TECH_STACKS[0].slug) : ""), []);

  const form = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      topic: defaultTopic,
      questionType: "Coding",
      difficulty: "Medium",
      content: "",
      tags: [],
      source: undefined,
    },
    mode: "onChange",
  });

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      if (!id) {
        setLoading(false);
        toast.error("Invalid question id");
        navigate("/questions", { replace: true });
        return;
      }

      setLoading(true);
      try {
        const found = await db.questions.get(id);
        if (!mounted) return;
        if (!found) {
          toast.error("Question not found");
          navigate("/questions", { replace: true });
          return;
        }

        setSourceLabel(found.source ?? null);
        form.reset({
          topic: found.topic ? normalizeTopicSlug(found.topic) : defaultTopic,
          questionType: (found.questionType ?? "Coding") as QuestionType,
          difficulty: found.difficulty as Difficulty,
          content: found.content ?? "",
          tags: normalizeTags(found.tags),
          source: found.source,
        });
      } catch (err) {
        if (!mounted) return;
        toast.error(`Load failed: ${err instanceof Error ? err.message : String(err)}`);
        navigate("/questions", { replace: true });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, [defaultTopic, form, id, navigate]);

  const tags = form.watch("tags");
  const canAddTag = useMemo(() => {
    const next = tagDraft.trim();
    if (!next) return false;
    if ((tags ?? []).includes(next)) return false;
    return (tags ?? []).length < 5;
  }, [tagDraft, tags]);

  const addTag = () => {
    const next = tagDraft.trim();
    if (!next) return;
    const current = normalizeTags(form.getValues("tags"));
    if (current.includes(next)) return;
    if (current.length >= 5) return;
    form.setValue("tags", [...current, next], { shouldDirty: true, shouldTouch: true, shouldValidate: true });
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    const current = normalizeTags(form.getValues("tags"));
    form.setValue(
      "tags",
      current.filter((t) => t !== tag),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  };

  const onSubmit = async (values: QuestionFormValues) => {
    if (!id) return;
    setSaving(true);
    try {
      const normalizedContent = values.content.trim().replace(/\r\n/g, "\n");
      const normalizedTopic = normalizeTopicSlug(values.topic);
      const normalizedTags = normalizeTags(values.tags);
      const contentHash = await computeContentHash(normalizedTopic, normalizedContent);

      await db.questions.update(id, {
        topic: normalizedTopic,
        questionType: values.questionType,
        difficulty: values.difficulty as Difficulty,
        content: normalizedContent,
        tags: normalizedTags.length ? normalizedTags : undefined,
        contentHash,
        source: sourceLabel ?? values.source ?? "user-import",
      });

      toast.success("Changes saved to notebook");
      navigate("/questions", { replace: true });
    } catch (err) {
      toast.error(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen paper-surface px-4 py-10 font-ui text-ink">
        <div className="mx-auto w-full max-w-2xl border-sketch bg-white p-8">
          <div className="flex items-center gap-3 text-sm text-ink-light">
            <Loader2 className="h-4 w-4 animate-spin text-ink" />
            Loading question...
          </div>
        </div>
      </div>
    );
  }

  const errors = form.formState.errors;
  const topicValue = form.watch("topic");
  const hasTopicOption = Boolean(topicValue && TECH_STACKS.some((t) => t.slug === topicValue));

  return (
    <div className="min-h-screen overflow-x-hidden paper-surface font-ui text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-2xl flex-col px-6 pb-8 pt-6">
        <header className="mb-6 flex items-center justify-between gap-4 border-b border-ink/10 pb-4">
          <Link to="/questions" className="group flex items-center gap-2 text-sm font-semibold text-ink-light hover:text-ink transition-colors">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            <span className="font-heading italic tracking-wide">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <PenTool className="h-4 w-4 text-gold" aria-hidden="true" />
            <span className="font-heading text-lg font-bold">Edit Question</span>
          </div>
        </header>

        <div className="border-sketch bg-white p-6">
          <form className="space-y-6" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="topic" className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">
                  Topic
                </Label>
                <Select
                  value={topicValue}
                  onValueChange={(v) => form.setValue("topic", v, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                >
                  <SelectTrigger
                    id="topic"
                    className={cn(
                      "h-10 rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-0 shadow-none",
                      "focus:ring-0 focus:ring-offset-0",
                      errors.topic ? "border-red-300" : "focus-visible:border-ink",
                    )}
                  >
                    <SelectValue placeholder="Select topic" />
                  </SelectTrigger>
                  <SelectContent className="border-sketch bg-white">
                    {!hasTopicOption && topicValue ? <SelectItem value={topicValue}>{topicValue}</SelectItem> : null}
                    {TECH_STACKS.map((t) => (
                      <SelectItem key={t.slug} value={t.slug}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.topic?.message ? (
                  <div className="text-xs text-red-700">{errors.topic.message}</div>
                ) : null}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">Source</Label>
                <div className="flex h-10 items-center justify-between border-b-2 border-ink/10">
                  <div className="text-sm text-ink">{sourceLabel ?? "-"}</div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">Type</Label>
                <Select
                  value={form.watch("questionType")}
                  onValueChange={(v) => form.setValue("questionType", v as QuestionType, { shouldDirty: true, shouldTouch: true, shouldValidate: true })}
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-0 shadow-none",
                      "focus:ring-0 focus:ring-offset-0",
                    )}
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="border-sketch bg-white">
                    <SelectItem value="Coding">Coding</SelectItem>
                    <SelectItem value="Concept">Concept</SelectItem>
                    <SelectItem value="Design">Design</SelectItem>
                    <SelectItem value="Scenario">Scenario</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">Difficulty</Label>
                <Select
                  value={form.watch("difficulty")}
                  onValueChange={(v) =>
                    form.setValue("difficulty", v as Difficulty, { shouldDirty: true, shouldTouch: true, shouldValidate: true })
                  }
                >
                  <SelectTrigger
                    className={cn(
                      "h-10 rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-0 shadow-none",
                      "focus:ring-0 focus:ring-offset-0",
                    )}
                  >
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent className="border-sketch bg-white">
                    <SelectItem value="Simple">Simple</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="content" className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">
                Content (Markdown)
              </Label>
              <textarea
                id="content"
                rows={10}
                className={cn(
                  "w-full resize-y rounded-none border-0 border-b-2 border-ink/20 bg-transparent px-0 py-2 text-sm leading-relaxed text-ink placeholder:text-ink/30",
                  "focus-visible:outline-none",
                  errors.content ? "border-red-300" : "focus-visible:border-ink",
                )}
                placeholder="Write the question prompt in Markdown..."
                {...form.register("content")}
              />
              {errors.content?.message ? (
                <div className="text-xs text-red-700">{errors.content.message}</div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-ink-light font-heading">Tags</Label>
              <div className="flex flex-wrap items-center gap-2">
                {(tags ?? []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-slate-50 px-3 py-1 text-xs text-ink">
                    <span className="font-body">{tag}</span>
                    <button
                      type="button"
                      className="rounded p-0.5 text-ink/40 hover:text-ink"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ))}

                <input
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className={cn(
                    "h-9 min-w-[12rem] flex-1 border-0 border-b-2 border-ink/20 bg-transparent px-0 text-sm",
                    "focus-visible:outline-none focus-visible:border-ink",
                  )}
                  placeholder={(tags ?? []).length >= 5 ? "Max 5 tags" : "Type a tag and press Enter"}
                  disabled={(tags ?? []).length >= 5}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                {errors.tags?.message ? <div className="text-xs text-red-700">{errors.tags.message}</div> : <div />}
                <div className="text-xs text-ink-light">{(tags ?? []).length} / 5</div>
              </div>
              {canAddTag ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-sketch bg-white text-ink hover:text-gold"
                  onClick={() => addTag()}
                >
                  Add “{tagDraft.trim()}”
                </Button>
              ) : null}
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 pt-4">
              <Button
                type="button"
                variant="outline"
                className="border-sketch bg-white text-ink-light hover:text-ink"
                onClick={() => navigate("/questions")}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" className="bg-ink text-white hover:bg-ink/90" disabled={saving || !form.formState.isValid}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
