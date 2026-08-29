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

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <header className="bg-surface-container-lowest shadow-soft">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="font-headline-md text-primary font-bold">Taskly</h1>
          <SignOutButton />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8">
        <TodoList initialTodos={todos || []} userId={userId} />
      </main>
    </div>
  );
}
