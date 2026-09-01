import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { UUID, TITLE_MAX } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerUpdateTodo(server: McpServer, userId: string) {
  server.registerTool("update_todo", {
    title: "Update Todo",
    description: "Update an existing todo. Only provided fields change.",
    inputSchema: {
      id: UUID.describe("Todo ID"),
      title: z.string().min(1).max(TITLE_MAX).optional().describe("New title"),
      due_date: z.string().max(10).optional().describe("New due date or empty to clear"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("New priority"),
      completed: z.boolean().optional().describe("Mark completed or not"),
      project_id: UUID.optional().describe("New project ID or empty to unassign"),
    },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const updates: Record<string, unknown> = {};
    if (params.title !== undefined) updates.title = params.title;
    if (params.due_date !== undefined) updates.due_date = params.due_date || null;
    if (params.priority !== undefined) updates.priority = params.priority;
    if (params.completed !== undefined) updates.completed = params.completed;
    if (params.project_id !== undefined) updates.project_id = params.project_id || null;
    if (!Object.keys(updates).length) return { content: [{ type: "text" as const, text: "No fields to update." }] };

    if (params.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", params.project_id).eq("user_id", userId).single();
      if (!project) return { content: [{ type: "text" as const, text: "Project not found." }] };
    }

    const { error } = await supabase.from("todos").update(updates).eq("id", params.id).eq("user_id", userId);
    if (error) throw new Error("Failed to update todo.");
    return { content: [{ type: "text" as const, text: `Todo ${params.id} updated.` }] };
  });
}
