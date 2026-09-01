import type { McpContext } from "@/lib/mcp/schema";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListLabels(server: McpServer, ctx: McpContext) {
  server.registerTool("list_labels", {
    title: "List Labels",
    description: "List all labels.",
    inputSchema: {},
  }, async () => {
    const { data: labels, error } = await ctx.supabase
      .from("labels").select("*").eq("user_id", ctx.userId).order("name");
    if (error) throw new Error("Failed to fetch labels.");
    if (!labels?.length) return { content: [{ type: "text" as const, text: "No labels found." }] };
    const text = labels.map((l) => `${l.name} (${l.color}) — id: ${l.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });
}
