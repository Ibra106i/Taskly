import { createSupabaseClient } from "@/lib/supabase/server";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListProjects(server: McpServer, userId: string) {
  server.registerTool("list_projects", {
    title: "List Projects",
    description: "List all projects.",
    inputSchema: {},
  }, async () => {
    const supabase = createSupabaseClient();
    const { data: projects, error } = await supabase.from("projects").select("*").eq("user_id", userId).order("name");
    if (error) throw new Error("Failed to fetch projects.");
    if (!projects?.length) return { content: [{ type: "text" as const, text: "No projects found." }] };
    const text = projects.map((p) => `${p.name} (${p.color}) — id: ${p.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });
}
