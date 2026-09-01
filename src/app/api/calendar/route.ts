import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";
import ical from "ical-generator";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: todos } = await supabase
    .from("todos")
    .select("title, due_date, completed, priority")
    .eq("user_id", userId)
    .not("due_date", "is", null);

  const calendar = ical({ name: "TaskMax" });

  todos?.forEach((todo) => {
    if (!todo.due_date) return;
    const date = new Date(todo.due_date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    calendar.createEvent({
      start: date,
      end: nextDay,
      summary: `${todo.completed ? "✓ " : ""}${todo.title}`,
      description: todo.priority ? `Priority: ${todo.priority}` : undefined,
    });
  });

  const icsContent = calendar.toString();

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="taskmax.ics"',
    },
  });
}
