import type { McpServer } from "@modelcontextprotocol/server";

export type ToolContext = {
  userId: string;
  register: McpServer["registerTool"];
};
