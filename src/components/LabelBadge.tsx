"use client";

import { Label } from "@/lib/types";

interface LabelBadgeProps {
  label: Label;
  onRemove?: () => void;
}

export default function LabelBadge({ label, onRemove }: LabelBadgeProps) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white"
      style={{ backgroundColor: label.color }}
    >
      {label.name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-0.5 hover:opacity-70"
        >
          ×
        </button>
      )}
    </span>
  );
}
