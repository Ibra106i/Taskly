import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/mcp/crypto";
import { UUID, SEARCH_MAX } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListTodos(server: McpServer, userId: string) {
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
    const supabase = createSupabaseClient();
    let query = supabase.from("todos").select("*").eq("user_id", userId);

    if (params.search) {
      query = query.ilike("title", `%${escapeLike(params.search)}%`);
    }

    if (params.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", params.project_id).eq("user_id", userId).single();
      if (!project) return { content: [{ type: "text" as const, text: "Project not found." }] };
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

    const { data: todos, error } = await query.order("position", { ascending: true });
    if (error) throw new Error("Failed to fetch todos.");

    let result = todos || [];
    if (params.label_id) {
      const { data: label } = await supabase
        .from("labels").select("id").eq("id", params.label_id).eq("user_id", userId).single();
      if (!label) return { content: [{ type: "text" as const, text: "Label not found." }] };

      const { data: tl } = await supabase.from("todo_labels").select("todo_id").eq("label_id", params.label_id);
      const ids = new Set(tl?.map((t) => t.todo_id) || []);
      result = result.filter((t) => ids.has(t.id));
    }

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
