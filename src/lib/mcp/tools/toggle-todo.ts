import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerToggleTodo(server: McpServer, userId: string) {
  server.registerTool("toggle_todo", {
    title: "Toggle Todo",
    description: "Toggle a todo's completed status.",
    inputSchema: {
      id: UUID.describe("Todo ID"),
      completed: z.boolean().describe("New completed status"),
    },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("todos").update({ completed: params.completed }).eq("id", params.id).eq("user_id", userId);
    if (error) throw new Error("Failed to toggle todo.");
    return { content: [{ type: "text" as const, text: `Todo ${params.id} marked as ${params.completed ? "completed" : "not completed"}.` }] };
  });
}
