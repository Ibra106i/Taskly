"use client";

import { useState } from "react";

export default function StatsActions() {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReport = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/reports/daily", {
        method: "GET",
      });
      if (res.ok) setSent(true);
    } catch (e) {
      console.error("Failed to send report", e);
    } finally {
      setSending(false);
    }
  };

  const handleExportIcs = () => {
    window.location.href = "/api/calendar";
  };

  return (
    <div className="flex gap-sm">
      <button
        onClick={handleSendReport}
        disabled={sending || sent}
        className="flex items-center gap-sm px-4 py-2 rounded-xl text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-50"
      >
        <span className="material-symbols-outlined text-[16px]">
          {sent ? "check_circle" : "mail"}
        </span>
        {sent ? "Report sent!" : sending ? "Sending..." : "Send daily report"}
      </button>
      <button
        onClick={handleExportIcs}
        className="flex items-center gap-sm px-4 py-2 rounded-xl text-sm font-medium bg-surface-variant text-on-surface-variant hover:bg-surface-secondary transition-colors"
      >
        <span className="material-symbols-outlined text-[16px]">calendar_today</span>
        Export .ics
      </button>
    </div>
  );
}
