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
            <ApiKeyManager appUrl={appUrl} />
          </div>

          <div className="p-6 rounded-3xl bg-[var(--color-surface)] shadow-[var(--shadow-soft)]">
            <h3 className="text-lg font-semibold text-[var(--color-text)] mb-4">How to Connect</h3>
            <ol className="space-y-2 text-sm text-[var(--color-text-muted)]">
              <li>1. Generate an API key above</li>
              <li>2. Copy the connection URL shown after generation</li>
              <li>3. Open Claude Desktop → Settings → Developer → MCP Servers</li>
              <li>4. Click &quot;Add new MCP server&quot;</li>
              <li>5. Name it &quot;Taskly&quot; and paste the URL</li>
              <li>6. Restart Claude Desktop</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
