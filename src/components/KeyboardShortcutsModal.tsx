"use client";

import { motion, AnimatePresence } from "motion/react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Ctrl", "K"], label: "Focus search" },
  { keys: ["/"], label: "Focus search" },
  { keys: ["Ctrl", "N"], label: "Focus new task input" },
  { keys: ["Ctrl", "D"], label: "Complete first active task" },
  { keys: ["?"], label: "Toggle this shortcuts panel" },
  { keys: ["↑", "↓"], label: "Navigate between tasks" },
  { keys: ["Enter"], label: "Toggle task completion" },
  { keys: ["E"], label: "Edit selected task" },
  { keys: ["Del"], label: "Delete selected task" },
  { keys: ["Esc"], label: "Clear search / close panel / blur input" },
];

export default function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-surface rounded-3xl p-xl w-[380px] max-h-[80vh] overflow-y-auto"
            style={{ boxShadow: "0px 24px 64px rgba(113, 121, 118, 0.16)" }}
          >
            <div className="flex items-center justify-between mb-lg">
              <h3 className="font-headline-md text-on-surface font-bold">Keyboard Shortcuts</h3>
              <button
                onClick={onClose}
                className="p-sm rounded-lg hover:bg-surface-variant text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
            <div className="space-y-sm">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-sm">
                  <span className="text-sm text-on-surface">{s.label}</span>
                  <div className="flex items-center gap-1">
                    {s.keys.map((key) => (
                      <kbd
                        key={key}
                        className="px-2 py-1 text-[11px] font-mono bg-surface-secondary border border-outline-variant/30 rounded-lg text-on-surface-variant min-w-[28px] text-center"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
