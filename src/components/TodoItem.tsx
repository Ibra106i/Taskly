"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { CATEGORIES, DURATIONS, formatDuration, formatDate, getDueDateColor } from "@/lib/constants";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date: string | null;
  duration_minutes: number | null;
  category: string | null;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: { title?: string; due_date?: string | null; duration_minutes?: number | null; category?: string | null }) => void;
}

export default function TodoItem({ todo, onToggle, onDelete, onUpdate }: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDueDate, setEditDueDate] = useState(todo.due_date?.split("T")[0] || "");
  const [editDuration, setEditDuration] = useState(todo.duration_minutes?.toString() || "");
  const [editCategory, setEditCategory] = useState(todo.category || "");
  const [showOptions, setShowOptions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const optionsRef = useRef<HTMLDivElement>(null);
  const editContainerRef = useRef<HTMLDivElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0,
  };

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(e.target as Node)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveEdit = () => {
    const title = editTitle.trim();
    if (!title) {
      setEditTitle(todo.title);
      setEditing(false);
      return;
    }

    onUpdate(todo.id, {
      title,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      duration_minutes: editDuration ? parseInt(editDuration) : null,
      category: editCategory || null,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date?.split("T")[0] || "");
    setEditDuration(todo.duration_minutes?.toString() || "");
    setEditCategory(todo.category || "");
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) saveEdit();
    if (e.key === "Escape") cancelEdit();
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    if (editContainerRef.current?.contains(e.relatedTarget as Node)) return;
    saveEdit();
  };

  const categoryObj = todo.category ? CATEGORIES.find((c) => c.name === todo.category) : null;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="py-lg px-lg hover:bg-[#F7F5F0]/50 transition-colors group rounded-xl"
    >
      <div className="flex items-center gap-md">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-outline-variant/40 hover:text-outline-variant transition-colors shrink-0 touch-none"
        >
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>

        <motion.button
          onClick={() => onToggle(todo.id, !todo.completed)}
          whileTap={{ scale: 0.85 }}
          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all shrink-0 ${
            todo.completed
              ? "bg-primary border-primary"
              : "border-outline-variant hover:border-primary"
          }`}
        >
          <AnimatePresence mode="wait">
            {todo.completed && (
              <motion.span
                key="check"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                className="material-symbols-outlined text-[14px] text-on-primary"
              >
                check
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        {editing ? (
          <div ref={editContainerRef} className="flex-1 flex flex-col gap-sm">
            <input
              ref={inputRef}
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleInputBlur}
              className="w-full h-8 px-2 rounded-lg bg-[#F7F5F0] border-none shadow-inner-soft font-body-md text-on-surface focus:ring-2 focus:ring-primary focus:outline-none"
            />
            <div className="flex gap-sm flex-wrap">
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 px-2 rounded-lg bg-[#F7F5F0] border-none shadow-inner-soft font-label-sm text-on-surface-variant focus:ring-2 focus:ring-primary focus:outline-none text-[12px]"
              />
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 px-2 rounded-lg bg-[#F7F5F0] border-none shadow-inner-soft font-label-sm text-on-surface-variant focus:ring-2 focus:ring-primary focus:outline-none text-[12px]"
              >
                <option value="">Duration</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{formatDuration(d)}</option>
                ))}
              </select>
              <div className="flex gap-xs">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => setEditCategory(editCategory === cat.name ? "" : cat.name)}
                    className={`h-7 px-2 rounded-full text-[11px] font-medium transition-all ${
                      editCategory === cat.name
                        ? "text-on-primary"
                        : "text-on-surface-variant hover:opacity-80"
                    }`}
                    style={{
                      backgroundColor: editCategory === cat.name ? cat.color : `${cat.color}20`,
                    }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <span
              onDoubleClick={() => setEditing(true)}
              className={`font-body-md transition-all cursor-pointer block ${
                todo.completed
                  ? "text-on-surface-variant line-through decoration-outline-variant/50"
                  : "text-on-surface"
              }`}
            >
              {todo.title}
            </span>
            <div className="flex items-center gap-sm mt-xs flex-wrap">
              {todo.due_date && (
                <span className={`font-label-sm ${getDueDateColor(todo.due_date)}`}>
                  {formatDate(todo.due_date)}
                </span>
              )}
              {todo.duration_minutes && (
                <span className="font-label-sm text-on-surface-variant">
                  {formatDuration(todo.duration_minutes)}
                </span>
              )}
              {categoryObj && (
                <span
                  className="font-label-sm px-xs py-[1px] rounded-full text-on-primary"
                  style={{ backgroundColor: categoryObj.color }}
                >
                  {categoryObj.name}
                </span>
              )}
            </div>
          </div>
        )}

        {!editing && (
          <div className="relative" ref={optionsRef}>
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-on-surface p-sm rounded-lg hover:bg-[#F7F5F0]"
              aria-label="More options"
            >
              <span className="material-symbols-outlined text-[18px]">more_horiz</span>
            </button>

            <AnimatePresence>
              {showOptions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 bg-surface-container-lowest rounded-xl shadow-soft p-sm z-10 min-w-[120px]"
                >
                  <button
                    onClick={() => {
                      setEditing(true);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm rounded-lg hover:bg-[#F7F5F0] text-on-surface-variant text-[13px] font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(todo.id);
                      setShowOptions(false);
                    }}
                    className="w-full flex items-center gap-sm px-md py-sm rounded-lg hover:bg-error-container/20 text-error text-[13px] font-medium transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                    Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  );
}
