import { McpServer } from "@modelcontextprotocol/server";
import { registerListTodos } from "@/lib/mcp/tools/list-todos";
import { registerGetTodo } from "@/lib/mcp/tools/get-todo";
import { registerCreateTodo } from "@/lib/mcp/tools/create-todo";
import { registerUpdateTodo } from "@/lib/mcp/tools/update-todo";
import { registerDeleteTodo } from "@/lib/mcp/tools/delete-todo";
import { registerToggleTodo } from "@/lib/mcp/tools/toggle-todo";
import { registerListProjects } from "@/lib/mcp/tools/list-projects";
import { registerListLabels } from "@/lib/mcp/tools/list-labels";
import { registerSearchTodos } from "@/lib/mcp/tools/search-todos";

export function createTasklyMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "taskly", version: "1.0.0" });

  registerListTodos(server, userId);
  registerGetTodo(server, userId);
  registerCreateTodo(server, userId);
  registerUpdateTodo(server, userId);
  registerDeleteTodo(server, userId);
  registerToggleTodo(server, userId);
  registerListProjects(server, userId);
  registerListLabels(server, userId);
  registerSearchTodos(server, userId);

  return server;
}
