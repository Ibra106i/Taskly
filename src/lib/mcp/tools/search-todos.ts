import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/mcp/crypto";
import { SEARCH_MAX } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerSearchTodos(server: McpServer, userId: string) {
  server.registerTool("search_todos", {
    title: "Search Todos",
    description: "Search todos by title.",
    inputSchema: { query: z.string().min(1).max(SEARCH_MAX).describe("Search query") },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { data: todos, error } = await supabase.from("todos").select("*").eq("user_id", userId).ilike("title", `%${escapeLike(params.query)}%`).order("position", { ascending: true }).limit(20);
    if (error) throw new Error("Failed to search todos.");
    if (!todos?.length) return { content: [{ type: "text" as const, text: `No todos matching "${params.query}".` }] };
    const text = todos.map((t) => `${t.completed ? "[x]" : "[ ]"} ${t.title} — id: ${t.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });
}
