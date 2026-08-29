import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase/server";
import TodoList from "@/components/TodoList";
import SignOutButton from "@/components/SignOutButton";

export default async function Home() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const supabase = createSupabaseClient();
  const { data: todos } = await supabase
    .from("todos")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const completedCount = todos?.filter((t) => t.completed).length || 0;
  const totalCount = todos?.length || 0;

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="bg-surface-container-lowest shadow-soft sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="font-headline-md text-primary font-bold tracking-tight">
            Taskly
          </h1>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {totalCount > 0 && (
          <div className="flex items-center justify-between mb-lg">
            <p className="font-label-md text-on-surface-variant">
              {completedCount} of {totalCount} completed
            </p>
            <div className="h-2 w-32 bg-[#F7F5F0] rounded-full overflow-hidden shadow-inner-soft">
              <div
                className="h-full bg-primary-container rounded-full transition-all duration-500"
                style={{
                  width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        )}

        <TodoList initialTodos={todos || []} userId={userId} />
      </main>
    </div>
  );
}
