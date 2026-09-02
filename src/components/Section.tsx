"use client";

import { useState, useRef, useEffect } from "react";
import { Section as SectionType, Todo, Label } from "@/lib/types";
import { updateSection, deleteSection } from "@/lib/sections";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import TodoItem from "./TodoItem";

interface SectionProps {
  section: SectionType;
  todos: Todo[];
  labels: Label[];
  todoLabelsMap: Record<string, string[]>;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onAddTodo: (title: string, sectionId: string) => void;
  onAddSubTodo: (parentId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  onTodoLabelIdsChange: (todoId: string, labelIds: string[]) => void;
  onSectionChange: (sections: SectionType[]) => void;
  allSections: SectionType[];
}

export default function Section({
  section,
  todos,
  labels,
  todoLabelsMap,
  onToggle,
  onDelete,
  onUpdate,
  onAddTodo,
  onAddSubTodo,
  onLabelsChange,
  onTodoLabelIdsChange,
  onSectionChange,
  allSections,
}: SectionProps) {
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(section.name);
  const [newTodo, setNewTodo] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingName && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [editingName]);

  const saveName = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === section.name) {
      setName(section.name);
      setEditingName(false);
      return;
    }
    setSaving(true);
    try {
      await updateSection(section.id, { name: trimmed });
      onSectionChange(allSections.map((s) => (s.id === section.id ? { ...s, name: trimmed } : s)));
    } catch (e) {
      console.error("Failed to rename section", e);
      setName(section.name);
    }
    setSaving(false);
    setEditingName(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${section.name}"? Tasks will move to unsectioned.`)) return;
    setDeleting(true);
    try {
      await deleteSection(section.id);
      onSectionChange(allSections.filter((s) => s.id !== section.id));
    } catch (e) {
      console.error("Failed to delete section", e);
      setDeleting(false);
    }
  };

  const handleAddTodo = () => {
    if (!newTodo.trim()) return;
    onAddTodo(newTodo.trim(), section.id);
    setNewTodo("");
  };

  return (
    <div className="mb-md">
      <div className="flex items-center gap-sm mb-sm group/section">
        {editingName ? (
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={saveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveName();
              if (e.key === "Escape") {
                setName(section.name);
                setEditingName(false);
              }
            }}
            className="text-sm font-medium text-on-surface bg-transparent border-b border-outline-variant/30 outline-none"
          />
        ) : (
          <button
            onClick={() => setEditingName(true)}
            className="text-sm font-medium text-on-surface hover:text-primary transition-colors"
          >
            {section.name}
          </button>
        )}
        <span className="text-xs text-on-surface-variant">{todos.length}</span>
        <div className="hidden group-hover/section:flex items-center gap-0.5 ml-auto">
          <button
            onClick={() => setEditingName(true)}
            disabled={saving}
            className="p-0.5 rounded hover:bg-surface-secondary text-on-surface-variant disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-0.5 rounded hover:bg-surface-secondary text-error disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{deleting ? "hourglass_empty" : "delete"}</span>
          </button>
        </div>
      </div>

      <SortableContext items={todos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-xs ml-md">
          {todos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              labels={labels}
              todoLabelIds={todoLabelsMap[todo.id] || []}
              onToggle={onToggle}
              onDelete={onDelete}
              onUpdate={onUpdate}
              onAddSubTodo={onAddSubTodo}
              onLabelsChange={onLabelsChange}
              onTodoLabelIdsChange={onTodoLabelIdsChange}
            />
          ))}
        </div>
      </SortableContext>

      <div className="ml-md mt-sm">
        {isAdding ? (
          <div className="flex gap-sm">
            <input
              ref={inputRef}
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTodo();
                if (e.key === "Escape") {
                  setNewTodo("");
                  setIsAdding(false);
                }
              }}
              onBlur={() => {
                if (!newTodo.trim()) setIsAdding(false);
              }}
              placeholder={`Add to ${section.name}...`}
              className="flex-1 h-8 px-2 rounded-lg tactile-input text-sm"
              autoFocus
            />
            <button
              onClick={handleAddTodo}
              disabled={!newTodo.trim()}
              className="px-2 h-8 rounded-lg bg-primary text-white hover:bg-primary-hover disabled:opacity-50 transition-all text-sm"
            >
              Add
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-sm text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-base">add</span>
            Add task
          </button>
        )}
      </div>
    </div>
  );
}
