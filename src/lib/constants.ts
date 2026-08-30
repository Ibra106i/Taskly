export const PRIORITIES = [
  { name: "high", label: "High", color: "#ba1a1a" },
  { name: "medium", label: "Medium", color: "#c1a87d" },
  { name: "low", label: "Low", color: "#84a59d" },
] as const;

export type Priority = (typeof PRIORITIES)[number]["name"];

export const DURATIONS = [5, 10, 15, 30, 45, 60, 90, 120];

export const RECURRENCE_OPTIONS = [
  { value: "daily", label: "Every day" },
  { value: "weekly:monday", label: "Every Monday" },
  { value: "weekly:tuesday", label: "Every Tuesday" },
  { value: "weekly:wednesday", label: "Every Wednesday" },
  { value: "weekly:thursday", label: "Every Thursday" },
  { value: "weekly:friday", label: "Every Friday" },
  { value: "weekly:saturday", label: "Every Saturday" },
  { value: "weekly:sunday", label: "Every Sunday" },
  { value: "monthly:1", label: "Monthly (1st)" },
  { value: "monthly:15", label: "Monthly (15th)" },
  { value: "every:3:days", label: "Every 3 days" },
  { value: "every:7:days", label: "Every 7 days" },
  { value: "every:14:days", label: "Every 14 days" },
  { value: "every:30:days", label: "Every 30 days" },
];

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

export function formatRecurrence(rule: string | null): string {
  if (!rule) return "";
  const option = RECURRENCE_OPTIONS.find((o) => o.value === rule);
  return option ? option.label : rule;
}

export function getNextOccurrence(rule: string, from: Date): Date {
  const next = new Date(from);

  if (rule === "daily") {
    next.setDate(next.getDate() + 1);
  } else if (rule.startsWith("weekly:")) {
    const dayName = rule.split(":")[1];
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const targetDay = days.indexOf(dayName);
    const currentDay = next.getDay();
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd <= 0) daysToAdd += 7;
    next.setDate(next.getDate() + daysToAdd);
  } else if (rule.startsWith("monthly:")) {
    const day = parseInt(rule.split(":")[1]);
    next.setMonth(next.getMonth() + 1);
    next.setDate(day);
  } else if (rule.startsWith("every:")) {
    const parts = rule.split(":");
    const num = parseInt(parts[1]);
    next.setDate(next.getDate() + num);
  }

  return next;
}
