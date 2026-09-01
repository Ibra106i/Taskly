import { createMcpHandler, requireBearerAuth } from "@modelcontextprotocol/server";
import { apiKeyVerifier } from "@/lib/mcp/auth";
import { createTasklyMcpServer } from "@/lib/mcp/server";

function createHandler() {
  return createMcpHandler(
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
}

const authGate = requireBearerAuth({
  verifier: apiKeyVerifier,
  resourceMetadataUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mcp/.well-known/oauth-protected-resource`,
});

function verifyOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) return null;

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      return new Response(JSON.stringify({ error: "Origin mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  return null;
}

export async function POST(request: Request) {
  const originRejection = verifyOrigin(request);
  if (originRejection) return originRejection;

  const auth = await authGate(request);
  if (auth instanceof Response) return auth;

  const handler = createHandler();
  return handler.fetch(request, { authInfo: auth });
}

export async function GET(request: Request) {
  const auth = await authGate(request);
  if (auth instanceof Response) return auth;
  return Response.json({ status: "ok", server: "taskly", tools: 9 });
}

export async function DELETE(request: Request) {
  const auth = await authGate(request);
  if (auth instanceof Response) return auth;
  return new Response(null, { status: 204 });
}
