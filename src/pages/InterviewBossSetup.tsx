import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { db, type InterviewBlueprint } from "@/lib/db";
import { createBossSession, ensureDefaultBlueprints } from "@/lib/interviewEngine";

export default function InterviewBossSetup() {
  const navigate = useNavigate();
  const [candidateName, setCandidateName] = useState("");
  const [blueprints, setBlueprints] = useState<InterviewBlueprint[]>([]);
  const [blueprintId, setBlueprintId] = useState<string>("");
  const [frameworks, setFrameworks] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);

  useEffect(() => {
    let mounted = true;
    const run = async () => {
      setIsLoading(true);
      try {
        await ensureDefaultBlueprints();
        const list = await db.blueprints.orderBy("name").toArray();
        if (!mounted) return;
        setBlueprints(list);
        setBlueprintId(list[0]?.id ?? "");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    void run();
    return () => {
      mounted = false;
    };
  }, []);

  const selected = useMemo(() => blueprints.find((b) => b.id === blueprintId) ?? null, [blueprintId, blueprints]);

  useEffect(() => {
    if (!selected) return;
    const defaults = selected.strategy.electiveDomains.map((d) => d.topic).filter(Boolean);
    setFrameworks(defaults.length > 0 ? defaults : []);
  }, [selected]);

  const toggleFramework = (name: string) => {
    setFrameworks((prev) => {
      const set = new Set(prev);
      if (set.has(name)) set.delete(name);
      else set.add(name);
      return [...set];
    });
  };

  const start = async () => {
    if (!blueprintId) return;
    setIsStarting(true);
    try {
      const session = await createBossSession({ blueprintId, candidateName, selectedFrameworks: frameworks });
      navigate(`/boss/${encodeURIComponent(session.id)}`);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="min-h-screen paper-surface px-4 py-10 font-ui text-ink">
      <div className="mx-auto w-full max-w-3xl border-sketch bg-white p-8">
        <div className="flex items-baseline justify-between border-b border-ink/10 pb-4">
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight">Interview Boss</h1>
            <p className="mt-1 text-sm text-ink-light">Campus 模拟：先基础筛选，再框架深挖，最后算法收尾。</p>
          </div>
          <Button variant="outline" onClick={() => navigate("/")} className="border-sketch bg-white text-ink hover:text-gold">
            Back
          </Button>
        </div>

        <div className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Candidate Name</div>
            <Input
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="e.g. Alex"
              className="border-ink/10"
            />
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Blueprint</div>
            <Select value={blueprintId} onValueChange={setBlueprintId} disabled={isLoading || blueprints.length === 0}>
              <SelectTrigger className="border-ink/10">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select a blueprint"} />
              </SelectTrigger>
              <SelectContent>
                {blueprints.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selected ? (
              <div className="text-xs text-ink-light">
                Required: {selected.strategy.requiredDomains.map((d) => d.topic).join(" / ")} · Deep Dive:{" "}
                {selected.strategy.electiveDomains.map((d) => d.topic).join(" / ")}
              </div>
            ) : null}
          </div>

          <div className="grid gap-2">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-ink-light">Frameworks</div>
            <div className="flex flex-wrap gap-2">
              {["Vue", "React", "Electron"].map((name) => {
                const active = frameworks.includes(name);
                return (
                  <Button
                    key={name}
                    type="button"
                    variant={active ? "default" : "outline"}
                    onClick={() => toggleFramework(name)}
                    className={active ? "bg-ink text-white hover:bg-ink/90" : "border-sketch bg-white text-ink hover:text-gold"}
                  >
                    {name}
                  </Button>
                );
              })}
            </div>
            <div className="text-xs text-ink-light">多选：会在深挖阶段轮流出题。</div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button
            onClick={start}
            disabled={isStarting || isLoading || !blueprintId || frameworks.length === 0}
            className="bg-ink text-white hover:bg-gold hover:text-ink"
          >
            {isStarting ? "Starting..." : "Start Session"}
          </Button>
        </div>
      </div>
    </div>
  );
}
