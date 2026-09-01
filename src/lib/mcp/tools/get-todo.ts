import { UUID, type McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerGetTodo(server: McpServer, ctx: McpContext) {
  server.registerTool("get_todo", {
    title: "Get Todo",
    description: "Get a single todo by ID with sub-tasks and labels.",
    inputSchema: { id: UUID.describe("Todo ID") },
  }, async (params) => {
    const { data: todo, error } = await ctx.supabase
      .from("todos").select("*").eq("id", params.id).eq("user_id", ctx.userId).single();
    if (error || !todo) return { content: [{ type: "text" as const, text: "Todo not found." }] };

    const [subsResult, labelsResult] = await Promise.all([
      ctx.supabase.from("todos")
        .select("id, title, completed")
        .eq("parent_id", params.id)
        .eq("user_id", ctx.userId)
        .order("position"),
      ctx.supabase.from("todo_labels")
        .select("labels(name)")
        .eq("todo_id", params.id),
    ]);

    const lines = [
      `Title: ${todo.title}`,
      `Completed: ${todo.completed}`,
      `Priority: ${todo.priority || "none"}`,
      `Due: ${todo.due_date || "none"}`,
      `Project: ${todo.project_id || "none"}`,
      `Recurrence: ${todo.recurrence_rule || "none"}`,
    ];

    if (!labelsResult.error && labelsResult.data) {
      const labelNames = labelsResult.data
        .map((l) => (l.labels as unknown as { name: string })?.name)
        .filter(Boolean);
      if (labelNames.length) lines.push(`Labels: ${labelNames.join(", ")}`);
    }

    if (!subsResult.error && subsResult.data?.length) {
      lines.push("Sub-tasks:");
      subsResult.data.forEach((s) => lines.push(`  ${s.completed ? "[x]" : "[ ]"} ${s.title}`));
    }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  });
}
