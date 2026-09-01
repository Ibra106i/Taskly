import { McpServer } from "@modelcontextprotocol/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import { registerListTodos } from "@/lib/mcp/tools/list-todos";
import { registerGetTodo } from "@/lib/mcp/tools/get-todo";
import { registerCreateTodo } from "@/lib/mcp/tools/create-todo";
import { registerUpdateTodo } from "@/lib/mcp/tools/update-todo";
import { registerDeleteTodo } from "@/lib/mcp/tools/delete-todo";
import { registerToggleTodo } from "@/lib/mcp/tools/toggle-todo";
import { registerListProjects } from "@/lib/mcp/tools/list-projects";
import { registerListLabels } from "@/lib/mcp/tools/list-labels";
import { registerSearchTodos } from "@/lib/mcp/tools/search-todos";
import type { McpContext } from "@/lib/mcp/schema";

export function createTasklyMcpServer(userId: string, supabase: SupabaseClient): McpServer {
  const server = new McpServer({ name: "taskly", version: "1.0.0" });
  const ctx: McpContext = { userId, supabase };

  registerListTodos(server, ctx);
  registerGetTodo(server, ctx);
  registerCreateTodo(server, ctx);
  registerUpdateTodo(server, ctx);
  registerDeleteTodo(server, ctx);
  registerToggleTodo(server, ctx);
  registerListProjects(server, ctx);
  registerListLabels(server, ctx);
  registerSearchTodos(server, ctx);

  return server;
}
