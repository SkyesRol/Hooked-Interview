import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StagedItem } from "@/components/import/types";
import { resolveTech } from "@/constants/topics";

function statusBadge(item: StagedItem) {
  if (item.status === "valid") return <Badge variant="success">Valid</Badge>;
  if (item.status === "duplicate") return <Badge variant="warning">Exact Duplicate</Badge>;
  return <Badge variant="destructive">Error</Badge>;
}

export default function StagingList({
  items,
  onForceAdd,
  onRemove,
}: {
  items: StagedItem[];
  onForceAdd: (tempId: string) => void;
  onRemove: (tempId: string) => void;
}) {
  if (!items.length) {
    return <div className="rounded-md border border-dashed border-slate-200 bg-white p-6 text-sm text-slate-600">暂无暂存项。</div>;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <Card key={item._tempId}>
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-base">{resolveTech(item.payload.topic)?.label ?? item.payload.topic}</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                {statusBadge(item)}
                <Badge variant="secondary">{item.payload.difficulty}</Badge>
                <Badge variant="outline">{item.payload.questionType}</Badge>
                <Badge variant="outline">{item.source === "manual" ? "Manual" : "JSON"}</Badge>
                {item.payload.tags.length ? <Badge variant="secondary">{item.payload.tags.join(", ")}</Badge> : null}
              </div>
              {item.errorMsg ? <p className="text-sm text-red-600">{item.errorMsg}</p> : null}
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              {item.status === "duplicate" ? (
                <Button type="button" size="sm" onClick={() => onForceAdd(item._tempId)}>
                  强制加入
                </Button>
              ) : null}
              <Button type="button" size="sm" variant="outline" onClick={() => onRemove(item._tempId)}>
                删除
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <pre className="max-h-44 overflow-auto whitespace-pre-wrap break-words rounded-md bg-slate-50 p-3 text-sm text-slate-800">
              {item.payload.content}
            </pre>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
