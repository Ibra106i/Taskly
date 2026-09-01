import type { McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListProjects(server: McpServer, ctx: McpContext) {
  server.registerTool("list_projects", {
    title: "List Projects",
    description: "List all projects.",
    inputSchema: {},
  }, async () => {
    const { data: projects, error } = await ctx.supabase
      .from("projects").select("*").eq("user_id", ctx.userId).order("name");
    if (error) throw new Error("Failed to fetch projects.");
    if (!projects?.length) return { content: [{ type: "text" as const, text: "No projects found." }] };
    const text = projects.map((p) => `${p.name} (${p.color}) — id: ${p.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });
}
