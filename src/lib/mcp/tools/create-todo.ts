import { z } from "zod";
import { UUID, TITLE_MAX, RECURRENCE_VALUES, type McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerCreateTodo(server: McpServer, ctx: McpContext) {
  server.registerTool("create_todo", {
    title: "Create Todo",
    description: "Create a new todo.",
    inputSchema: {
      title: z.string().min(1).max(TITLE_MAX).describe("Todo title"),
      due_date: z.string().max(10).optional().describe("Due date YYYY-MM-DD"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("Priority"),
      project_id: UUID.optional().describe("Project ID"),
      recurrence_rule: z.enum(RECURRENCE_VALUES).optional().describe("Recurrence rule"),
    },
  }, async (params) => {
    if (params.project_id) {
      const { data: project } = await ctx.supabase
        .from("projects").select("id").eq("id", params.project_id).eq("user_id", ctx.userId).single();
      if (!project) return { content: [{ type: "text" as const, text: "Project not found." }] };
    }

    const { data: existing } = await ctx.supabase
      .from("todos").select("position").eq("user_id", ctx.userId).is("parent_id", null)
      .order("position", { ascending: false }).limit(1);
    const position = existing?.length ? (existing[0].position || 0) + 1 : 0;

    const { data: todo, error } = await ctx.supabase.from("todos").insert({
      title: params.title,
      user_id: ctx.userId,
      due_date: params.due_date || null,
      priority: params.priority || null,
      project_id: params.project_id || null,
      recurrence_rule: params.recurrence_rule || null,
      position,
    }).select().single();

    if (error) throw new Error("Failed to create todo.");
    return { content: [{ type: "text" as const, text: `Created "${todo.title}" (id: ${todo.id})` }] };
  });
}
