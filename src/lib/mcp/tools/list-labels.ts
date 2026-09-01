import { createSupabaseClient } from "@/lib/supabase/server";
import type { McpServer } from "@modelcontextprotocol/server";

export function registerListLabels(server: McpServer, userId: string) {
  server.registerTool("list_labels", {
    title: "List Labels",
    description: "List all labels.",
    inputSchema: {},
  }, async () => {
    const supabase = createSupabaseClient();
    const { data: labels, error } = await supabase.from("labels").select("*").eq("user_id", userId).order("name");
    if (error) throw new Error("Failed to fetch labels.");
    if (!labels?.length) return { content: [{ type: "text" as const, text: "No labels found." }] };
    const text = labels.map((l) => `${l.name} (${l.color}) — id: ${l.id}`).join("\n");
    return { content: [{ type: "text" as const, text }] };
  });
}
