export const CATEGORIES = [
  { name: "Work", color: "#45645e" },
  { name: "Personal", color: "#8c4e35" },
  { name: "School", color: "#7b554d" },
  { name: "Health", color: "#84a59d" },
];

export const PRIORITIES = [
  { name: "high", label: "High", color: "#ba1a1a" },
  { name: "medium", label: "Medium", color: "#c1a87d" },
  { name: "low", label: "Low", color: "#84a59d" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["name"];

export const DURATIONS = [5, 10, 15, 30, 45, 60, 90, 120];

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDate.getTime() === today.getTime()) return "Today";
  if (taskDate.getTime() === tomorrow.getTime()) return "Tomorrow";
  if (taskDate < today) return "Overdue";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getDueDateColor(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const taskDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (taskDate < today) return "text-error";
  if (taskDate.getTime() === today.getTime()) return "text-[#8c4e35]";
  return "text-on-surface-variant";
}

export function getPriorityColor(priority: string | null): string {
  if (!priority) return "";
  const p = PRIORITIES.find((pr) => pr.name === priority);
  return p ? p.color : "";
}
