import { z } from "zod";
import { UUID, type McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerToggleTodo(server: McpServer, ctx: McpContext) {
  server.registerTool("toggle_todo", {
    title: "Toggle Todo",
    description: "Toggle a todo's completed status.",
    inputSchema: {
      id: UUID.describe("Todo ID"),
      completed: z.boolean().describe("New completed status"),
    },
  }, async (params) => {
    const { data, error } = await ctx.supabase
      .from("todos").update({ completed: params.completed })
      .eq("id", params.id).eq("user_id", ctx.userId).select("id");

    if (error) throw new Error("Failed to toggle todo.");
    if (!data?.length) return { content: [{ type: "text" as const, text: "Todo not found or not authorized." }] };
    return { content: [{ type: "text" as const, text: `Todo ${params.id} marked as ${params.completed ? "completed" : "not completed"}.` }] };
  });
}
