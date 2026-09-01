import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import ApiKeyManager from "@/components/ApiKeyManager";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Settings</h1>
          <Link
            href="/"
            className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
          >
            Back to Taskly
          </Link>
        </div>

        <div className="space-y-8">
          <div className="p-6 rounded-3xl bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <ApiKeyManager />
          </div>

          <div className="p-6 rounded-3xl bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">MCP Connection</h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Server URL</p>
                <code className="block text-sm text-[var(--color-text)] bg-[var(--color-surface-inset)] px-3 py-2 rounded-xl font-mono">
                  {appUrl}/api/mcp
                </code>
              </div>
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-1">Claude Desktop Config</p>
                <pre className="text-xs text-[var(--color-text)] bg-[var(--color-surface-inset)] px-3 py-2 rounded-xl font-mono overflow-x-auto">
{`{
  "mcpServers": {
    "taskly": {
      "url": "${appUrl}/api/mcp",
      "headers": {
        "Authorization": "Bearer <your-api-key>"
      }
    }
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
