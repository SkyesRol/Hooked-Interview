import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { History as HistoryIcon, RefreshCcw } from "lucide-react";
import { HistoryCard } from "@/components/history/HistoryCard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRecordStore } from "@/store/useRecordStore";

export default function History() {
  const navigate = useNavigate();
  const loadRecords = useRecordStore((s) => s.loadRecords);
  const records = useRecordStore((s) => s.records);
  const isLoading = useRecordStore((s) => s.isLoading);

  const [filterTopic, setFilterTopic] = useState<string>("All");

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const topics = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) set.add(r.topic);
    return ["All", ...[...set].sort((a, b) => a.localeCompare(b))];
  }, [records]);

  const filteredRecords = useMemo(() => {
    if (filterTopic === "All") return records;
    return records.filter((r) => r.topic === filterTopic);
  }, [filterTopic, records]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold text-slate-950">Interview History</h1>
            <p className="text-sm text-slate-600">Review your past interviews and retry mistakes.</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-sm text-slate-600" htmlFor="history-topic-filter">
              Topic
            </label>
            <select
              id="history-topic-filter"
              value={filterTopic}
              onChange={(e) => setFilterTopic(e.target.value)}
              className={cn(
                "h-9 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-900",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2",
              )}
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={() => void loadRecords()} disabled={isLoading}>
              <RefreshCcw className="h-4 w-4" />
              刷新
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">正在加载记录...</div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <HistoryIcon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-base font-semibold text-slate-950">No records yet</h2>
            <p className="mt-1 text-sm text-slate-600">Start your first interview to generate history records.</p>
            <div className="mt-6 flex justify-center">
              <Button onClick={() => navigate("/")}>Back to Home</Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredRecords.map((record) => (
              <HistoryCard key={record.id} record={record} onClick={() => navigate(`/history/${record.id}`)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
