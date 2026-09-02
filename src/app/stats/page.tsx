import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
import StatsActions from "@/components/StatsActions";

export const metadata: Metadata = {
  title: "Stats — TaskMax",
  description:
    "View your productivity trends, completion rates, and task breakdowns.",
};

export default async function StatsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const supabase = createSupabaseClient();
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId);

  const total = todos?.length || 0;
  const completed = todos?.filter((t) => t.completed).length || 0;
  const active = total - completed;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const completedThisWeek = todos?.filter((t) => {
    if (!t.completed) return false;
    const created = new Date(t.created_at);
    return created >= weekAgo;
  }).length || 0;

  const overdue = todos?.filter((t) => {
    if (t.completed || !t.due_date) return false;
    return new Date(t.due_date) < today;
  }).length || 0;

  const byCategory: Record<string, { total: number; done: number }> = {};
  todos?.forEach((t) => {
    const cat = t.category || "Uncategorized";
    if (!byCategory[cat]) byCategory[cat] = { total: 0, done: 0 };
    byCategory[cat].total++;
    if (t.completed) byCategory[cat].done++;
  });

  const byPriority: Record<string, { total: number; done: number }> = {};
  todos?.forEach((t) => {
    const pri = t.priority || "None";
    if (!byPriority[pri]) byPriority[pri] = { total: 0, done: 0 };
    byPriority[pri].total++;
    if (t.completed) byPriority[pri].done++;
  });

  const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const completionsByDay: Record<string, number> = {};
  daysOfWeek.forEach((d) => (completionsByDay[d] = 0));
  todos?.forEach((t) => {
    if (!t.completed) return;
    const d = daysOfWeek[new Date(t.created_at).getDay()];
    completionsByDay[d]++;
  });
  const maxDay = Math.max(...Object.values(completionsByDay), 1);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface sticky top-0 z-10" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-sm font-headline-md text-primary font-bold tracking-tight">
            <Image src="/logo.png" alt="TaskMax" width={28} height={28} className="rounded-lg" />
            TaskMax
          </Link>
          <Link href="/" className="text-on-surface-variant hover:text-on-surface text-sm font-medium transition-colors">
            Back to todos
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="font-headline-lg text-on-surface font-bold mb-xl">Stats</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-md mb-xl">
          {[
            { label: "Total", value: total, icon: "list" },
            { label: "Active", value: active, icon: "pending" },
            { label: "Done", value: completed, icon: "check_circle" },
            { label: "Rate", value: `${completionRate}%`, icon: "trending_up" },
          ].map((stat) => (
            <div key={stat.label} className="bg-surface rounded-3xl p-lg text-center" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
              <span className="material-symbols-outlined text-primary text-[24px] mb-sm block">{stat.icon}</span>
              <p className="font-headline-md text-on-surface font-bold">{stat.value}</p>
              <p className="font-label-sm text-on-surface-variant">{stat.label}</p>
            </div>
          ))}
        </div>

        {overdue > 0 && (
          <div className="bg-error-container/30 rounded-3xl p-lg mb-xl flex items-center gap-md">
            <span className="material-symbols-outlined text-error text-[24px]">warning</span>
            <div>
              <p className="font-body-md text-on-surface font-medium">{overdue} overdue task{overdue > 1 ? "s" : ""}</p>
              <p className="font-label-sm text-on-surface-variant">Due dates have passed</p>
            </div>
          </div>
        )}

        <div className="bg-surface rounded-3xl p-xl mb-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
          <h3 className="font-headline-md text-on-surface font-bold mb-lg">Actions</h3>
          <StatsActions />
        </div>

        <div className="bg-surface rounded-3xl p-xl mb-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
          <h3 className="font-headline-md text-on-surface font-bold mb-lg">This Week</h3>
          <p className="font-headline-xl text-primary font-bold">{completedThisWeek}</p>
          <p className="font-label-md text-on-surface-variant">tasks completed</p>
        </div>

        {Object.keys(completionsByDay).some((d) => completionsByDay[d] > 0) && (
          <div className="bg-surface rounded-3xl p-xl mb-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
            <h3 className="font-headline-md text-on-surface font-bold mb-lg">By Day of Week</h3>
            <div className="flex items-end gap-sm h-32">
              {daysOfWeek.map((day) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-xs">
                  <div
                    className="w-full bg-primary-container rounded-t-md transition-all duration-500"
                    style={{ height: `${(completionsByDay[day] / maxDay) * 100}%`, minHeight: completionsByDay[day] > 0 ? "4px" : "0" }}
                  />
                  <span className="font-label-sm text-on-surface-variant">{day}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(byCategory).length > 0 && (
          <div className="bg-surface rounded-3xl p-xl mb-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
            <h3 className="font-headline-md text-on-surface font-bold mb-lg">By Category</h3>
            <div className="space-y-md">
              {Object.entries(byCategory).map(([cat, data]) => (
                <div key={cat}>
                  <div className="flex justify-between mb-xs">
                    <span className="font-label-md text-on-surface">{cat}</span>
                    <span className="font-label-sm text-on-surface-variant">{data.done}/{data.total}</span>
                  </div>
                  <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${data.total > 0 ? (data.done / data.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {Object.keys(byPriority).length > 0 && (
          <div className="bg-surface rounded-3xl p-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
            <h3 className="font-headline-md text-on-surface font-bold mb-lg">By Priority</h3>
            <div className="space-y-md">
              {Object.entries(byPriority).map(([pri, data]) => (
                <div key={pri}>
                  <div className="flex justify-between mb-xs">
                    <span className="font-label-md text-on-surface capitalize">{pri}</span>
                    <span className="font-label-sm text-on-surface-variant">{data.done}/{data.total}</span>
                  </div>
                  <div className="h-2 bg-surface-variant rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-container rounded-full transition-all duration-500"
                      style={{ width: `${data.total > 0 ? (data.done / data.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
