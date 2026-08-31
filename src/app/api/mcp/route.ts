import { createMcpHandler, requireBearerAuth } from "@modelcontextprotocol/server";
import { apiKeyVerifier } from "@/lib/mcp/auth";
import { createTasklyMcpServer } from "@/lib/mcp/server";

const mcpHandler = createMcpHandler(
  async ({ authInfo }) => {
    const userId = authInfo?.clientId;
    if (!userId) throw new Error("Unauthorized");
    return createTasklyMcpServer(userId);
  },
  {
    legacy: "reject",
    onerror: (error) => console.error("MCP error:", error),
  }
);

const authGate = requireBearerAuth({
  verifier: apiKeyVerifier,
  resourceMetadataUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mcp/.well-known/oauth-protected-resource`,
});

export async function POST(request: Request) {
  const auth = await authGate(request);
  if (auth instanceof Response) return auth;
  return mcpHandler.fetch(request, { authInfo: auth });
}

export async function GET(request: Request) {
  const auth = await authGate(request);
  if (auth instanceof Response) return auth;
  return Response.json({ status: "ok", server: "taskly", tools: 9 });
}

export async function DELETE() {
  return new Response(null, { status: 204 });
}
