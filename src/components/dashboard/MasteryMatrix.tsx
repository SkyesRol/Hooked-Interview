import type { TechStack } from "@/constants/topics";
import { TECH_STACKS } from "@/constants/topics";
import TechPanel from "@/components/dashboard/TechPanel";

export default function MasteryMatrix({
  getStats,
  onStartInterview,
}: {
  getStats: (topicLabel: string) => { count: number; avgScore: number; lastActive?: string };
  onStartInterview: (tech: TechStack) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {TECH_STACKS.map((tech) => (
        <TechPanel
          key={tech.slug}
          tech={tech.label}
          icon={tech.icon}
          stats={getStats(tech.label)}
          onClick={() => onStartInterview(tech)}
        />
      ))}
    </div>
  );
}

