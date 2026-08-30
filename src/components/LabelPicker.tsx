"use client";

import { useState, useRef, useEffect } from "react";
import { Label } from "@/lib/types";
import LabelBadge from "./LabelBadge";
import { addLabel, updateLabel, deleteLabel } from "@/lib/labels";
import { LABEL_COLORS } from "@/lib/constants";

interface LabelPickerProps {
  labels: Label[];
  selectedLabelIds: string[];
  onSelectionChange: (labelIds: string[]) => void;
  onLabelsChange: (labels: Label[]) => void;
}

export default function LabelPicker({
  labels,
  selectedLabelIds,
  onSelectionChange,
  onLabelsChange,
}: LabelPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsCreating(false);
        setEditingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabels = labels.filter((l) => selectedLabelIds.includes(l.id));

  const toggleLabel = (id: string) => {
    const next = selectedLabelIds.includes(id)
      ? selectedLabelIds.filter((i) => i !== id)
      : [...selectedLabelIds, id];
    onSelectionChange(next);
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      const label = await addLabel(newName.trim(), newColor);
      onLabelsChange([...labels, label]);
      onSelectionChange([...selectedLabelIds, label.id]);
      setNewName("");
      setNewColor(LABEL_COLORS[0]);
      setIsCreating(false);
    } catch (e) {
      console.error("Failed to create label", e);
    }
  };

  const handleRename = async (id: string) => {
    if (!editingName.trim()) return;
    try {
      await updateLabel(id, { name: editingName.trim() });
      onLabelsChange(labels.map((l) => (l.id === id ? { ...l, name: editingName.trim() } : l)));
      setEditingId(null);
    } catch (e) {
      console.error("Failed to rename label", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLabel(id);
      onLabelsChange(labels.filter((l) => l.id !== id));
      onSelectionChange(selectedLabelIds.filter((i) => i !== id));
    } catch (e) {
      console.error("Failed to delete label", e);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1 text-sm text-on-surface-variant hover:text-on-surface"
      >
        <span className="material-symbols-outlined text-base">label</span>
        {selectedLabels.length > 0 ? (
          <span>{selectedLabels.length} label{selectedLabels.length > 1 ? "s" : ""}</span>
        ) : (
          <span>Labels</span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-56 bg-surface border border-outline-variant/30 rounded-xl shadow-lg z-50">
          {selectedLabels.length > 0 && (
            <div className="p-2 border-b border-outline-variant/30 flex flex-wrap gap-1">
              {selectedLabels.map((l) => (
                <LabelBadge key={l.id} label={l} onRemove={() => toggleLabel(l.id)} />
              ))}
            </div>
          )}

          <div className="p-1 max-h-48 overflow-y-auto">
            {labels.map((label) => (
              <div key={label.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-surface-secondary group">
                <button
                  type="button"
                  onClick={() => toggleLabel(label.id)}
                  className="flex items-center gap-2 flex-1 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  {editingId === label.id ? (
                    <input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(label.id);
                        if (e.key === "Escape") setEditingId(null);
                      }}
                      onBlur={() => handleRename(label.id)}
                      className="flex-1 bg-transparent border-b border-outline-variant/30 text-sm outline-none"
                      autoFocus
                    />
                  ) : (
                    <span className="text-sm">{label.name}</span>
                  )}
                  {selectedLabelIds.includes(label.id) && (
                    <span className="material-symbols-outlined text-base text-primary ml-auto">check</span>
                  )}
                </button>
                {editingId !== label.id && (
                  <div className="hidden group-hover:flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(label.id);
                        setEditingName(label.name);
                      }}
                      className="p-0.5 rounded hover:bg-surface-secondary text-on-surface-variant"
                    >
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      className="p-0.5 rounded hover:bg-surface-secondary text-error"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                )}
              </div>
            ))}

            {labels.length === 0 && !isCreating && (
              <p className="text-center text-on-surface-variant text-sm py-3">No labels yet</p>
            )}
          </div>

          <div className="p-2 border-t border-outline-variant/30">
            {isCreating ? (
              <div className="space-y-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreate();
                    if (e.key === "Escape") setIsCreating(false);
                  }}
                  placeholder="Label name"
                  className="w-full px-2 py-1 text-sm bg-surface-secondary border border-outline-variant/30 rounded-lg outline-none focus:border-primary"
                  autoFocus
                />
                <div className="flex flex-wrap gap-1">
                  {LABEL_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={`w-5 h-5 rounded-full border-2 ${
                        newColor === c ? "border-on-surface" : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={handleCreate}
                    className="flex-1 px-2 py-1 text-xs font-medium bg-primary text-white rounded-lg hover:bg-primary-hover"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-2 py-1 text-xs text-on-surface-variant rounded-lg hover:bg-surface-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsCreating(true)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-on-surface-variant hover:text-on-surface rounded-lg hover:bg-surface-secondary"
              >
                <span className="material-symbols-outlined text-base">add</span>
                New label
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
