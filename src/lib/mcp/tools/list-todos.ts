import { z } from "zod";
import { escapeLike } from "@/lib/mcp/crypto";
import { UUID, SEARCH_MAX, type McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListTodos(server: McpServer, ctx: McpContext) {
  server.registerTool("list_todos", {
    title: "List Todos",
    description: "List all todos. Optional filters: view (today/upcoming/inbox/all), project_id, label_id, search.",
    inputSchema: {
      view: z.enum(["today", "upcoming", "inbox", "all"]).optional().describe("Filter by view"),
      project_id: UUID.optional().describe("Filter by project ID"),
      label_id: UUID.optional().describe("Filter by label ID"),
      search: z.string().max(SEARCH_MAX).optional().describe("Search todos by title"),
    },
  }, async (params) => {
    let query = ctx.supabase.from("todos").select("*").eq("user_id", ctx.userId);

    if (params.search) {
      query = query.ilike("title", `%${escapeLike(params.search)}%`);
    }

    if (params.project_id) {
      query = query.eq("project_id", params.project_id);
    }

    if (params.view === "today") {
      const todayStr = new Date().toISOString().split("T")[0];
      query = query.eq("due_date", todayStr);
    } else if (params.view === "upcoming") {
      const todayStr = new Date().toISOString().split("T")[0];
      query = query.gt("due_date", todayStr);
    } else if (params.view === "inbox") {
      query = query.is("project_id", null);
    }

    if (params.label_id) {
      const { data: tl, error: tlError } = await ctx.supabase
        .from("todo_labels").select("todo_id").eq("label_id", params.label_id);
      if (tlError) throw new Error("Failed to fetch label associations.");
      const ids = tl?.map((t) => t.todo_id) || [];
      if (ids.length === 0) return { content: [{ type: "text" as const, text: "No todos found." }] };
      query = query.in("id", ids);
    }

    const { data: todos, error } = await query.order("position", { ascending: true });
    if (error) throw new Error("Failed to fetch todos.");

    const result = todos || [];
    if (result.length === 0) return { content: [{ type: "text" as const, text: "No todos found." }] };

    const text = result.map((t) => {
      const parts = [t.completed ? "[x]" : "[ ]", t.title];
      if (t.due_date) parts.push(`due:${t.due_date}`);
      if (t.priority) parts.push(`priority:${t.priority}`);
      return parts.join(" ");
    }).join("\n");

    return { content: [{ type: "text" as const, text }] };
  });
}
