import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createSupabaseClient } from "@/lib/supabase/server";
import TodoList from "@/components/TodoList";
import SignOutButton from "@/components/SignOutButton";
import ThemeToggle from "@/components/ThemeToggle";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const supabase = createSupabaseClient();

  const [todosResult, projectsResult, labelsResult, sectionsResult, todoLabelsResult] = await Promise.all([
    supabase
      .from("todos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("labels")
      .select("*")
      .eq("user_id", userId)
      .order("name"),
    supabase
      .from("sections")
      .select("*")
      .eq("user_id", userId)
      .order("position"),
    supabase
      .from("todo_labels")
      .select("*"),
  ]);

  const todos = todosResult.data || [];
  const projects = projectsResult.data || [];
  const labels = labelsResult.data || [];
  const sections = sectionsResult.data || [];
  const todoLabels = todoLabelsResult.data || [];

  const todoLabelsMap: Record<string, string[]> = {};
  todoLabels.forEach((tl) => {
    if (!todoLabelsMap[tl.todo_id]) todoLabelsMap[tl.todo_id] = [];
    todoLabelsMap[tl.todo_id].push(tl.label_id);
  });

  const completedCount = todos.filter((t) => t.completed).length;
  const totalCount = todos.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface shadow-soft sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-headline-md text-primary font-bold tracking-tight">
            Taskly
          </Link>
          <div className="flex items-center gap-sm">
            <Link href="/stats" className="p-sm rounded-lg hover:bg-primary/10 transition-colors text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-[20px]">bar_chart</span>
            </Link>
            <ThemeToggle />
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {totalCount > 0 && (
          <div className="flex items-center justify-between mb-lg">
            <p className="font-label-md text-on-surface-variant">
              {completedCount} of {totalCount} completed
            </p>
            <div className="h-2 w-32 bg-surface-variant rounded-full overflow-hidden" style={{ boxShadow: "inset 0px 1px 3px rgba(113, 121, 118, 0.1)" }}>
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        <TodoList
          initialTodos={todos}
          initialProjects={projects}
          initialLabels={labels}
          initialSections={sections}
          initialTodoLabels={todoLabelsMap}
        />
      </main>
    </div>
  );
}
