import { createMcpHandler, requireBearerAuth } from "@modelcontextprotocol/server";
import { apiKeyVerifier } from "@/lib/mcp/auth";
import { createTaskMaxMcpServer } from "@/lib/mcp/server";
import { createSupabaseClient } from "@/lib/supabase/server";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Cache-Control": "no-store",
  "Referrer-Policy": "no-referrer",
};

function securityResponse(base: Response): Response {
  const response = new Response(base.body, {
    status: base.status,
    statusText: base.statusText,
    headers: base.headers,
  });
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function verifyOrigin(request: Request): Response | null {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");

  if (!origin) return null;

  try {
    const originUrl = new URL(origin);
    if (host && originUrl.host !== host) {
      return new Response(JSON.stringify({ error: "Origin mismatch" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
      });
    }
  } catch {
    return new Response(JSON.stringify({ error: "Invalid origin" }), {
      status: 403,
      headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
    });
  }

  return null;
}

function injectBearerFromQuery(request: Request): Request {
  if (request.headers.get("authorization")) return request;

  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) return request;

  url.searchParams.delete("token");

  const modifiedRequest = new Request(url.toString(), {
    method: request.method,
    headers: new Headers(request.headers),
  });
  modifiedRequest.headers.set("authorization", `Bearer ${token}`);

  return modifiedRequest;
}

const authGate = requireBearerAuth({
  verifier: apiKeyVerifier,
  resourceMetadataUrl: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/mcp/.well-known/oauth-protected-resource`,
});

export async function POST(request: Request) {
  const originRejection = verifyOrigin(request);
  if (originRejection) return originRejection;

  const authed = injectBearerFromQuery(request);
  const auth = await authGate(authed);
  if (auth instanceof Response) return securityResponse(auth);

  const userId = auth.clientId;
  if (!userId) {
    return securityResponse(new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json", ...SECURITY_HEADERS },
    }));
  }

  const supabase = createSupabaseClient();
  const handler = createMcpHandler(
    async () => createTaskMaxMcpServer(userId, supabase),
    {
      legacy: "reject",
      onerror: (error) => console.error("MCP error:", error),
    }
  );

  return securityResponse(await handler.fetch(authed, { authInfo: auth }));
}

export async function GET(request: Request) {
  const authed = injectBearerFromQuery(request);
  const auth = await authGate(authed);
  if (auth instanceof Response) return securityResponse(auth);

  return securityResponse(Response.json(
    { status: "ok", server: "taskmax", tools: 9 },
    { headers: SECURITY_HEADERS }
  ));
}

export async function DELETE(request: Request) {
  const authed = injectBearerFromQuery(request);
  const auth = await authGate(authed);
  if (auth instanceof Response) return securityResponse(auth);

  return securityResponse(new Response(null, {
    status: 204,
    headers: SECURITY_HEADERS,
  }));
}
