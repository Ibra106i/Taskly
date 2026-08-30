"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Project } from "@/lib/types";
import { addProject, updateProject, deleteProject } from "@/lib/projects";

const PROJECT_COLORS = [
  "#45645e", "#8c4e35", "#7b554d", "#84a59d",
  "#6366f1", "#ec4899", "#f59e0b", "#10b981",
  "#3b82f6", "#8b5cf6", "#ef4444", "#06b6d4",
];

interface ProjectSidebarProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string | null) => void;
  onProjectsChange: (projects: Project[]) => void;
  todoCounts: Record<string, number>;
}

export default function ProjectSidebar({
  projects,
  selectedProjectId,
  onSelectProject,
  onProjectsChange,
  todoCounts,
}: ProjectSidebarProps) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PROJECT_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      const project = await addProject(name, newColor);
      onProjectsChange([...projects, project]);
      setNewName("");
      setAdding(false);
    } catch {}
  };

  const handleUpdate = async (id: string) => {
    const name = editName.trim();
    if (!name) return;
    try {
      await updateProject(id, { name });
      onProjectsChange(projects.map((p) => (p.id === id ? { ...p, name } : p)));
      setEditingId(null);
    } catch {}
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this project? Tasks won't be deleted.")) return;
    try {
      await deleteProject(id);
      onProjectsChange(projects.filter((p) => p.id !== id));
      if (selectedProjectId === id) onSelectProject(null);
    } catch {}
  };

  return (
    <div className="space-y-xs">
      <button
        onClick={() => onSelectProject(null)}
        className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium transition-colors ${
          selectedProjectId === null
            ? "bg-primary/10 text-primary"
            : "text-on-surface-variant hover:bg-surface-variant"
        }`}
      >
        <span className="material-symbols-outlined text-[16px]">inbox</span>
        Inbox
        {todoCounts["inbox"] ? (
          <span className="ml-auto text-[11px] text-on-surface-variant/60">{todoCounts["inbox"]}</span>
        ) : null}
      </button>

      {projects.map((project) => (
        <div key={project.id} className="group relative">
          {editingId === project.id ? (
            <div className="flex items-center gap-xs px-md py-sm">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdate(project.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onBlur={() => handleUpdate(project.id)}
                className="flex-1 h-7 px-2 rounded-lg tactile-input-inline text-[13px]"
                autoFocus
              />
            </div>
          ) : (
            <button
              onClick={() => onSelectProject(project.id)}
              className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium transition-colors ${
                selectedProjectId === project.id
                  ? "bg-primary/10 text-primary"
                  : "text-on-surface-variant hover:bg-surface-variant"
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: project.color }}
              />
              <span className="truncate">{project.name}</span>
              {todoCounts[project.id] ? (
                <span className="ml-auto text-[11px] text-on-surface-variant/60">{todoCounts[project.id]}</span>
              ) : null}
              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-xs ml-auto">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingId(project.id);
                    setEditName(project.name);
                  }}
                  className="material-symbols-outlined text-[14px] cursor-pointer hover:text-on-surface"
                >
                  edit
                </span>
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(project.id);
                  }}
                  className="material-symbols-outlined text-[14px] cursor-pointer hover:text-error"
                >
                  delete
                </span>
              </div>
            </button>
          )}
        </div>
      ))}

      <AnimatePresence>
        {adding ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="px-md py-sm space-y-sm">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") setAdding(false);
                }}
                placeholder="Project name"
                className="w-full h-8 px-2 rounded-lg tactile-input-inline text-[13px]"
                autoFocus
              />
              <div className="flex gap-xs flex-wrap">
                {PROJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-5 h-5 rounded-full transition-all ${
                      newColor === c ? "ring-2 ring-primary ring-offset-2" : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
              <div className="flex gap-sm">
                <button
                  onClick={handleAdd}
                  className="h-7 px-3 rounded-lg bg-primary text-on-primary text-[12px] font-medium"
                >
                  Add
                </button>
                <button
                  onClick={() => setAdding(false)}
                  className="h-7 px-3 rounded-lg text-on-surface-variant text-[12px] font-medium hover:bg-surface-variant"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium text-on-surface-variant/60 hover:text-on-surface-variant hover:bg-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Add project
          </button>
        )}
      </AnimatePresence>
    </div>
  );
}
