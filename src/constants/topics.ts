import type { LucideIcon } from "lucide-react";
import { Atom, BrainCircuit, Braces, Cpu, FileCode, GitBranch, Layout, Monitor, Palette, Terminal, Triangle, User } from "lucide-react";

export type TechStack = {
  slug: string;
  label: string;
  icon: LucideIcon;
};

export const TECH_STACKS: TechStack[] = [
  { slug: "vue", label: "Vue", icon: Triangle },
  { slug: "react", label: "React", icon: Atom },
  { slug: "javascript", label: "JavaScript", icon: Braces },
  { slug: "typescript", label: "TypeScript", icon: FileCode },
  { slug: "html", label: "HTML", icon: Layout },
  { slug: "css", label: "CSS", icon: Palette },
  { slug: "node", label: "Node.js", icon: Cpu },
  { slug: "electron", label: "Electron", icon: Monitor },
  { slug: "ai", label: "AI & LLM", icon: BrainCircuit },
  { slug: "browser", label: "Browser", icon: Monitor },
  { slug: "algorithms", label: "Algorithms", icon: Braces },
  { slug: "performance", label: "Performance", icon: Cpu },
  { slug: "frontend-engineering", label: "Frontend Engineering", icon: Terminal },
  { slug: "git", label: "Git", icon: GitBranch },
  { slug: "soft-skills", label: "Soft Skills", icon: User },
];

export const TOPICS = TECH_STACKS.map((t) => t.label) as unknown as readonly string[];

export type Topic = (typeof TECH_STACKS)[number]["label"];

export const TOPIC_ICON: Record<string, LucideIcon> = Object.fromEntries(TECH_STACKS.map((t) => [t.label, t.icon]));

export function getTechBySlug(slug: string) {
  return TECH_STACKS.find((t) => t.slug === slug);
}

export function getTechByLabel(label: string) {
  const needle = label.trim().toLowerCase();
  return TECH_STACKS.find((t) => t.label.toLowerCase() === needle);
}

export function resolveTech(input: string) {
  const raw = input.trim();
  if (!raw) return null;
  const bySlug = getTechBySlug(raw.toLowerCase());
  if (bySlug) return bySlug;
  const byLabel = getTechByLabel(raw);
  if (byLabel) return byLabel;
  return null;
}

export function normalizeTopicSlug(input: string) {
  const resolved = resolveTech(input);
  return resolved ? resolved.slug : input.trim();
}
