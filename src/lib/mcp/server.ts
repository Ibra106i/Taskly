import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";
import { createSupabaseClient } from "@/lib/supabase/server";
import { escapeLike } from "@/lib/mcp/auth";
import { RECURRENCE_OPTIONS } from "@/lib/constants";

const UUID = z.string().uuid();
const TITLE_MAX = 500;
const SEARCH_MAX = 100;
const RECURRENCE_VALUES = RECURRENCE_OPTIONS.map((o) => o.value) as [string, ...string[]];

export function createTasklyMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "taskly", version: "1.0.0" });

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
    if (error) return { content: [{ type: "text" as const, text: "Failed to fetch todos." }] };

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

  server.registerTool("get_todo", {
    title: "Get Todo",
    description: "Get a single todo by ID with sub-tasks and labels.",
    inputSchema: { id: UUID.describe("Todo ID") },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { data: todo, error } = await supabase.from("todos").select("*").eq("id", params.id).eq("user_id", userId).single();
    if (error || !todo) return { content: [{ type: "text" as const, text: "Todo not found." }] };

    const { data: subs } = await supabase.from("todos").select("id, title, completed").eq("parent_id", params.id).order("position");
    const { data: labels } = await supabase.from("todo_labels").select("labels(name)").eq("todo_id", params.id);

    const lines = [`Title: ${todo.title}`, `Completed: ${todo.completed}`, `Priority: ${todo.priority || "none"}`, `Due: ${todo.due_date || "none"}`, `Project: ${todo.project_id || "none"}`, `Recurrence: ${todo.recurrence_rule || "none"}`];
    const labelNames = labels?.map((l) => (l.labels as unknown as { name: string })?.name).filter(Boolean);
    if (labelNames?.length) lines.push(`Labels: ${labelNames.join(", ")}`);
    if (subs?.length) { lines.push("Sub-tasks:"); subs.forEach((s) => lines.push(`  ${s.completed ? "[x]" : "[ ]"} ${s.title}`)); }

    return { content: [{ type: "text" as const, text: lines.join("\n") }] };
  });

  server.registerTool("create_todo", {
    title: "Create Todo",
    description: "Create a new todo.",
    inputSchema: {
      title: z.string().min(1).max(TITLE_MAX).describe("Todo title"),
      due_date: z.string().max(10).optional().describe("Due date YYYY-MM-DD"),
      priority: z.enum(["high", "medium", "low"]).optional().describe("Priority"),
      project_id: UUID.optional().describe("Project ID"),
      recurrence_rule: z.enum(RECURRENCE_VALUES).optional().describe("Recurrence rule"),
    },
  }, async (params) => {
    const supabase = createSupabaseClient();

    if (params.project_id) {
      const { data: project } = await supabase
        .from("projects").select("id").eq("id", params.project_id).eq("user_id", userId).single();
      if (!project) return { content: [{ type: "text" as const, text: "Project not found." }] };
    }

    const { data: existing } = await supabase.from("todos").select("position").eq("user_id", userId).is("parent_id", null).order("position", { ascending: false }).limit(1);
    const position = existing?.length ? (existing[0].position || 0) + 1 : 0;

    const { data: todo, error } = await supabase.from("todos").insert({
      title: params.title, user_id: userId, due_date: params.due_date || null,
      priority: params.priority || null, project_id: params.project_id || null,
      recurrence_rule: params.recurrence_rule || null, position,
    }).select().single();

    if (error) return { content: [{ type: "text" as const, text: "Failed to create todo." }] };
    return { content: [{ type: "text" as const, text: `Created "${todo.title}" (id: ${todo.id})` }] };
  });

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
    if (error) return { content: [{ type: "text" as const, text: "Failed to update todo." }] };
    return { content: [{ type: "text" as const, text: `Todo ${params.id} updated.` }] };
  });

  server.registerTool("delete_todo", {
    title: "Delete Todo",
    description: "Delete a todo by ID.",
    inputSchema: { id: UUID.describe("Todo ID to delete") },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { error } = await supabase.from("todos").delete().eq("id", params.id).eq("user_id", userId);
    if (error) return { content: [{ type: "text" as const, text: "Failed to delete todo." }] };
    return { content: [{ type: "text" as const, text: `Todo ${params.id} deleted.` }] };
  });

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
    if (error) return { content: [{ type: "text" as const, text: "Failed to toggle todo." }] };
    return { content: [{ type: "text" as const, text: `Todo ${params.id} marked as ${params.completed ? "completed" : "not completed"}.` }] };
  });

  server.registerTool("list_projects", {
    title: "List Projects",
    description: "List all projects.",
    inputSchema: {},
  }, async () => {
    const supabase = createSupabaseClient();
    const { data: projects, error } = await supabase.from("projects").select("*").eq("user_id", userId).order("name");
    if (error) return { content: [{ type: "text" as const, text: "Failed to fetch projects." }] };
    if (!projects?.length) return { content: [{ type: "text" as const, text: "No projects found." }] };
    const text = projects.map((p) => `${p.name} (${p.color}) — id: ${p.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });

  server.registerTool("list_labels", {
    title: "List Labels",
    description: "List all labels.",
    inputSchema: {},
  }, async () => {
    const supabase = createSupabaseClient();
    const { data: labels, error } = await supabase.from("labels").select("*").eq("user_id", userId).order("name");
    if (error) return { content: [{ type: "text" as const, text: "Failed to fetch labels." }] };
    if (!labels?.length) return { content: [{ type: "text" as const, text: "No labels found." }] };
    const text = labels.map((l) => `${l.name} (${l.color}) — id: ${l.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });

  server.registerTool("search_todos", {
    title: "Search Todos",
    description: "Search todos by title.",
    inputSchema: { query: z.string().min(1).max(SEARCH_MAX).describe("Search query") },
  }, async (params) => {
    const supabase = createSupabaseClient();
    const { data: todos, error } = await supabase.from("todos").select("*").eq("user_id", userId).ilike("title", `%${escapeLike(params.query)}%`).order("position", { ascending: true }).limit(20);
    if (error) return { content: [{ type: "text" as const, text: "Failed to search todos." }] };
    if (!todos?.length) return { content: [{ type: "text" as const, text: `No todos matching "${params.query}".` }] };
    const text = todos.map((t) => `${t.completed ? "[x]" : "[ ]"} ${t.title} — id: ${t.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });

  return server;
}
