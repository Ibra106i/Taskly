#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const USER_ID = process.env.TASKLY_USER_ID;

if (!SUPABASE_URL || !SUPABASE_KEY || !USER_ID) {
  console.error("Missing env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, TASKLY_USER_ID");
  process.exit(1);
}

function getDb(): SupabaseClient {
  return createClient(SUPABASE_URL!, SUPABASE_KEY!);
}

const server = new McpServer({
  name: "taskly",
  version: "1.0.0",
});

// ─── TOOLS ───────────────────────────────────────────────

server.tool(
  "list_todos",
  "List all todos. Optionally filter by status (active/completed/all), project, label, or search text.",
  {
    status: z.enum(["active", "completed", "all"]).optional().describe("Filter by status (default: all)"),
    project_id: z.string().optional().describe("Filter by project ID"),
    label_id: z.string().optional().describe("Filter by label ID"),
    search: z.string().optional().describe("Search in todo titles"),
  },
  async ({ status, project_id, label_id, search }) => {
    const db = getDb();
    let query = db.from("todos").select("*").eq("user_id", USER_ID).order("created_at", { ascending: false });

    if (status === "active") query = query.eq("completed", false);
    else if (status === "completed") query = query.eq("completed", true);

    if (project_id) query = query.eq("project_id", project_id);

    if (search) query = query.ilike("title", `%${search}%`);

    const { data: todos, error } = await query;
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };

    let result = todos || [];

    if (label_id) {
      const { data: tl } = await db.from("todo_labels").select("todo_id").eq("label_id", label_id);
      const todoIds = new Set(tl?.map((r) => r.todo_id) || []);
      result = result.filter((t) => todoIds.has(t.id));
    }

    if (result.length === 0) return { content: [{ type: "text", text: "No todos found." }] };

    const lines = result.map((t) => {
      const check = t.completed ? "✓" : "○";
      const parts = [`${check} ${t.title}`];
      if (t.priority) parts.push(`[${t.priority}]`);
      if (t.due_date) parts.push(`due ${new Date(t.due_date).toLocaleDateString()}`);
      if (t.duration_minutes) parts.push(`${t.duration_minutes}m`);
      return `  ${parts.join("  ")}`;
    });

    return { content: [{ type: "text", text: `${result.length} todo${result.length > 1 ? "s" : ""}:\n${lines.join("\n")}` }] };
  }
);

server.tool(
  "get_todo",
  "Get details of a single todo by ID, including its sub-tasks and comments.",
  {
    id: z.string().describe("The todo ID"),
  },
  async ({ id }) => {
    const db = getDb();
    const { data: todo, error } = await db.from("todos").select("*").eq("id", id).single();
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };

    const { data: subs } = await db.from("todos").select("id, title, completed").eq("parent_id", id);
    const { data: comments } = await db.from("comments").select("body, created_at").eq("todo_id", id).order("created_at");

    const lines = [
      `Title: ${todo.title}`,
      `Completed: ${todo.completed ? "Yes" : "No"}`,
      `Priority: ${todo.priority || "None"}`,
      `Due: ${todo.due_date ? new Date(todo.due_date).toLocaleDateString() : "None"}`,
      `Duration: ${todo.duration_minutes ? `${todo.duration_minutes}m` : "None"}`,
      `Recurrence: ${todo.recurrence_rule || "None"}`,
      `Project: ${todo.project_id || "None"}`,
      `Section: ${todo.section_id || "None"}`,
    ];

    if (subs && subs.length > 0) {
      lines.push("", "Sub-tasks:");
      subs.forEach((s) => lines.push(`  ${s.completed ? "✓" : "○"} ${s.title}`));
    }

    if (comments && comments.length > 0) {
      lines.push("", "Comments:");
      comments.forEach((c) => lines.push(`  [${new Date(c.created_at).toLocaleDateString()}] ${c.body}`));
    }

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

server.tool(
  "add_todo",
  "Create a new todo.",
  {
    title: z.string().describe("Task title"),
    due_date: z.string().optional().describe("Due date (ISO format, e.g. 2026-08-30)"),
    priority: z.enum(["high", "medium", "low"]).optional().describe("Priority level"),
    duration_minutes: z.number().optional().describe("Estimated duration in minutes"),
    project_id: z.string().optional().describe("Assign to a project"),
    recurrence_rule: z.string().optional().describe("Recurrence rule (e.g. daily, weekly:monday)"),
  },
  async ({ title, due_date, priority, duration_minutes, project_id, recurrence_rule }) => {
    const db = getDb();
    const { data, error } = await db
      .from("todos")
      .insert({
        title,
        user_id: USER_ID,
        due_date: due_date ? new Date(due_date).toISOString() : null,
        priority: priority || null,
        duration_minutes: duration_minutes || null,
        project_id: project_id || null,
        recurrence_rule: recurrence_rule || null,
      })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: `Created: ${data.title} (id: ${data.id})` }] };
  }
);

server.tool(
  "update_todo",
  "Update an existing todo's fields.",
  {
    id: z.string().describe("The todo ID"),
    title: z.string().optional().describe("New title"),
    due_date: z.string().nullable().optional().describe("New due date (ISO), or null to clear"),
    priority: z.string().nullable().optional().describe("New priority, or null to clear"),
    duration_minutes: z.number().nullable().optional().describe("New duration in minutes, or null to clear"),
    project_id: z.string().nullable().optional().describe("New project ID, or null to unassign"),
    recurrence_rule: z.string().nullable().optional().describe("New recurrence rule, or null to clear"),
  },
  async ({ id, ...updates }) => {
    const db = getDb();
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v !== undefined) cleaned[k] = v;
    }
    if (Object.keys(cleaned).length === 0) return { content: [{ type: "text", text: "Nothing to update." }] };

    const { error } = await db.from("todos").update(cleaned).eq("id", id);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: `Updated todo ${id}` }] };
  }
);

server.tool(
  "complete_todo",
  "Mark a todo as completed or active.",
  {
    id: z.string().describe("The todo ID"),
    completed: z.boolean().describe("true to mark done, false to mark active"),
  },
  async ({ id, completed }) => {
    const db = getDb();
    const { error } = await db.from("todos").update({ completed }).eq("id", id);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: completed ? "Marked complete." : "Marked active." }] };
  }
);

server.tool(
  "delete_todo",
  "Delete a todo. Also deletes its sub-tasks.",
  {
    id: z.string().describe("The todo ID"),
  },
  async ({ id }) => {
    const db = getDb();
    const { error } = await db.from("todos").delete().eq("id", id);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: `Deleted todo ${id}` }] };
  }
);

server.tool(
  "list_projects",
  "List all projects with task counts.",
  {},
  async () => {
    const db = getDb();
    const { data: projects, error } = await db.from("projects").select("*").eq("user_id", USER_ID).order("name");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!projects || projects.length === 0) return { content: [{ type: "text", text: "No projects." }] };

    const { data: todos } = await db.from("todos").select("project_id, completed").eq("user_id", USER_ID);
    const counts: Record<string, { total: number; done: number }> = {};
    todos?.forEach((t) => {
      if (!t.project_id) return;
      if (!counts[t.project_id]) counts[t.project_id] = { total: 0, done: 0 };
      counts[t.project_id].total++;
      if (t.completed) counts[t.project_id].done++;
    });

    const lines = projects.map((p) => {
      const c = counts[p.id] || { total: 0, done: 0 };
      return `  ${p.name} (${c.done}/${c.done} done, ${c.total} total) [${p.color}] id: ${p.id}`;
    });

    return { content: [{ type: "text", text: `${projects.length} project${projects.length > 1 ? "s" : ""}:\n${lines.join("\n")}` }] };
  }
);

server.tool(
  "add_project",
  "Create a new project.",
  {
    name: z.string().describe("Project name"),
    color: z.string().optional().describe("Hex color (default: #6366f1)"),
  },
  async ({ name, color }) => {
    const db = getDb();
    const { data, error } = await db
      .from("projects")
      .insert({ name, color: color || "#6366f1", user_id: USER_ID })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: `Created project: ${data.name} (id: ${data.id})` }] };
  }
);

server.tool(
  "list_labels",
  "List all labels.",
  {},
  async () => {
    const db = getDb();
    const { data: labels, error } = await db.from("labels").select("*").eq("user_id", USER_ID).order("name");
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    if (!labels || labels.length === 0) return { content: [{ type: "text", text: "No labels." }] };

    const lines = labels.map((l) => `  ${l.name} [${l.color}] id: ${l.id}`);
    return { content: [{ type: "text", text: `${labels.length} label${labels.length > 1 ? "s" : ""}:\n${lines.join("\n")}` }] };
  }
);

server.tool(
  "add_label",
  "Create a new label.",
  {
    name: z.string().describe("Label name"),
    color: z.string().optional().describe("Hex color (default: #6366f1)"),
  },
  async ({ name, color }) => {
    const db = getDb();
    const { data, error } = await db
      .from("labels")
      .insert({ name, color: color || "#6366f1", user_id: USER_ID })
      .select()
      .single();

    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
    return { content: [{ type: "text", text: `Created label: ${data.name} (id: ${data.id})` }] };
  }
);

server.tool(
  "get_stats",
  "Get task completion statistics: total, completed, active, overdue count, and completion rate.",
  {},
  async () => {
    const db = getDb();
    const { data: todos, error } = await db.from("todos").select("completed, due_date, created_at").eq("user_id", USER_ID);
    if (error) return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };

    const total = todos?.length || 0;
    const completed = todos?.filter((t) => t.completed).length || 0;
    const active = total - completed;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = todos?.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < today).length || 0;

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const completedThisWeek = todos?.filter((t) => t.completed && new Date(t.created_at) >= weekAgo).length || 0;

    return {
      content: [{
        type: "text",
        text: [
          `Total: ${total}`,
          `Active: ${active}`,
          `Completed: ${completed}`,
          `Overdue: ${overdue}`,
          `Completion rate: ${rate}%`,
          `Completed this week: ${completedThisWeek}`,
        ].join("\n"),
      }],
    };
  }
);

// ─── RESOURCES ───────────────────────────────────────────

server.resource(
  "todos",
  "taskly://todos",
  async (uri) => {
    const db = getDb();
    const { data } = await db.from("todos").select("*").eq("user_id", USER_ID).order("created_at", { ascending: false });
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data || [], null, 2),
      }],
    };
  }
);

server.resource(
  "projects",
  "taskly://projects",
  async (uri) => {
    const db = getDb();
    const { data } = await db.from("projects").select("*").eq("user_id", USER_ID).order("name");
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(data || [], null, 2),
      }],
    };
  }
);

server.resource(
  "stats",
  "taskly://stats",
  async (uri) => {
    const db = getDb();
    const { data: todos } = await db.from("todos").select("completed, due_date, created_at").eq("user_id", USER_ID);

    const total = todos?.length || 0;
    const completed = todos?.filter((t) => t.completed).length || 0;
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const overdue = todos?.filter((t) => !t.completed && t.due_date && new Date(t.due_date) < today).length || 0;

    const stats = { total, completed, active: total - completed, overdue, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };

    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(stats, null, 2),
      }],
    };
  }
);

// ─── START ───────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Taskly MCP server running on stdio");
