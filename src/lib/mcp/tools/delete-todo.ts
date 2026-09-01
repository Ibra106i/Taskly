import { createSupabaseClient } from "@/lib/supabase/server";
import { UUID } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerDeleteTodo(server: McpServer, userId: string) {
  server.registerTool("delete_todo", {
    title: "Delete Todo",
    description: "Delete a todo by ID.",
    inputSchema: { id: UUID.describe("Todo ID to delete") },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("todos").delete().eq("id", params.id).eq("user_id", userId);
    if (error) throw new Error("Failed to delete todo.");
    return { content: [{ type: "text" as const, text: `Todo ${params.id} deleted.` }] };
  });
}
