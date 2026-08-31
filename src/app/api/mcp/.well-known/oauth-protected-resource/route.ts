import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json(
    {
      resource: `${baseUrl}/api/mcp`,
      authorization_servers: [
        {
          issuer: "taskly",
          authorization_endpoint: `${baseUrl}/api/mcp/authorize`,
          token_endpoint: `${baseUrl}/api/mcp/token`,
          registration_endpoint: `${baseUrl}/api/mcp/register`,
          response_types_supported: ["code"],
          grant_types_supported: ["authorization_code", "refresh_token"],
          token_endpoint_auth_methods_supported: ["client_secret_basic"],
          scopes_supported: ["read", "write"],
        },
      ],
      bearer_methods_supported: ["header"],
      scopes_supported: ["read", "write"],
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
