"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { generateApiKey, listApiKeys, revokeApiKey } from "@/lib/api-keys";

interface ApiKeyEntry {
  id: string;
  created_at: string;
  last_used_at: string | null;
}

export default function ApiKeyManager({ appUrl }: { appUrl: string }) {
  const [keys, setKeys] = useState<ApiKeyEntry[]>([]);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setLoading(true);
    try {
      const data = await listApiKeys();
      setKeys(data);
    } catch (e) {
      console.error("Failed to load API keys:", e);
    }
    setLoading(false);
  }

  async function handleGenerate() {
    setGenerating(true);
    try {
      const result = await generateApiKey();
      setNewKey(result.key);
      setShowNewKey(true);
      await loadKeys();
    } catch (e) {
      console.error("Failed to generate API key:", e);
    }
    setGenerating(false);
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this key? The AI agent using it will lose access.")) return;
    setRevokingId(id);
    try {
      await revokeApiKey(id);
      await loadKeys();
    } catch (e) {
      console.error("Failed to revoke API key:", e);
    }
    setRevokingId(null);
  }

  function copyKey() {
    if (newKey) {
      navigator.clipboard.writeText(newKey);
    }
  }

  function copyUrl() {
    if (newKey) {
      navigator.clipboard.writeText(`${appUrl}/api/mcp?token=${newKey}`);
    }
  }

  const mcpUrl = newKey ? `${appUrl}/api/mcp?token=${newKey}` : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--color-text)]">API Keys</h3>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Manage keys for AI agent access via MCP
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2 rounded-full bg-[var(--color-primary)] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {generating ? "Generating..." : "Generate Key"}
        </button>
      </div>

      <AnimatePresence>
        {showNewKey && newKey && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="p-4 rounded-2xl bg-[var(--color-surface-inset)] border border-[var(--color-primary)]/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-primary)] mb-1">
                    New API Key (copy it now, it won&apos;t be shown again)
                  </p>
                  <code className="block text-sm text-[var(--color-text)] bg-[var(--color-surface)] px-3 py-2 rounded-xl break-all font-mono">
                    {newKey}
                  </code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={copyKey}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors"
                  >
                    Copy
                  </button>
                  <button
                    onClick={() => setShowNewKey(false)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[var(--color-surface-inset)] border border-[var(--color-primary)]/20">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--color-primary)] mb-1">
                    Connect Claude Desktop — paste this URL
                  </p>
                  <code className="block text-xs text-[var(--color-text)] bg-[var(--color-surface)] px-3 py-2 rounded-xl break-all font-mono">
                    {mcpUrl}
                  </code>
                </div>
                <button
                  onClick={copyUrl}
                  className="px-3 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface)] text-[var(--color-text)] hover:bg-[var(--color-primary)]/10 transition-colors shrink-0"
                >
                  Copy URL
                </button>
              </div>
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                In Claude Desktop: Settings → Developer → MCP Servers → Add new MCP server → paste the URL above
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
            Loading keys...
          </div>
        ) : keys.length === 0 ? (
          <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">
            No API keys yet. Generate one to allow AI agents to access your tasks.
          </div>
        ) : (
          keys.map((key) => (
            <motion.div
              key={key.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 rounded-2xl bg-[var(--color-surface-inset)]"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm text-[var(--color-text)]">
                    {key.id.slice(0, 8)}...
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Created {new Date(key.created_at).toLocaleDateString()}
                  </span>
                </div>
                {key.last_used_at && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">
                    Last used {new Date(key.last_used_at).toLocaleDateString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => handleRevoke(key.id)}
                disabled={revokingId === key.id}
                className="text-xs text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
              >
                {revokingId === key.id ? "Revoking..." : "Revoke"}
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
