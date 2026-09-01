import { UUID, type McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerDeleteTodo(server: McpServer, ctx: McpContext) {
  server.registerTool("delete_todo", {
    title: "Delete Todo",
    description: "Delete a todo by ID.",
    inputSchema: { id: UUID.describe("Todo ID to delete") },
  }, async (params) => {
    const { data, error } = await ctx.supabase
      .from("todos").delete().eq("id", params.id).eq("user_id", ctx.userId).select("id");

    if (error) throw new Error("Failed to delete todo.");
    if (!data?.length) return { content: [{ type: "text" as const, text: "Todo not found or not authorized." }] };
    return { content: [{ type: "text" as const, text: `Todo ${params.id} deleted.` }] };
  });
}
