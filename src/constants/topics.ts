import type { LucideIcon } from "lucide-react";
import { Atom, Braces, Cpu, FileCode, Layout, Monitor, Palette, Triangle } from "lucide-react";

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
];

export const TOPICS = TECH_STACKS.map((t) => t.label) as unknown as readonly string[];

export type Topic = (typeof TECH_STACKS)[number]["label"];

export const TOPIC_ICON: Record<string, LucideIcon> = Object.fromEntries(TECH_STACKS.map((t) => [t.label, t.icon]));

export function getTechBySlug(slug: string) {
  return TECH_STACKS.find((t) => t.slug === slug);
}
