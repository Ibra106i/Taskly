"use client";

import { useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "motion/react";
import { Todo, Label } from "@/lib/types";
import { DURATIONS, PRIORITIES, RECURRENCE_OPTIONS, formatDuration, formatDate, getDueDateColor, getPriorityColor, formatRecurrence } from "@/lib/constants";
import LabelBadge from "./LabelBadge";
import LabelPicker from "./LabelPicker";
import CommentSection from "./CommentSection";
import { setTodoLabels } from "@/lib/labels";

interface TodoItemProps {
  todo: Todo;
  labels: Label[];
  todoLabelIds: string[];
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
  onAddSubTodo: (parentId: string) => void;
  onLabelsChange: (labels: Label[]) => void;
  onTodoLabelIdsChange: (todoId: string, labelIds: string[]) => void;
  depth?: number;
  isSelected?: boolean;
}

export default function TodoItem({
  todo,
  labels,
  todoLabelIds,
  onToggle,
  onDelete,
  onUpdate,
  onAddSubTodo,
  onLabelsChange,
  onTodoLabelIdsChange,
  depth = 0,
  isSelected = false,
}: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);
  const [editDueDate, setEditDueDate] = useState(todo.due_date?.split("T")[0] || "");
  const [editDuration, setEditDuration] = useState(todo.duration_minutes?.toString() || "");
  const [editPriority, setEditPriority] = useState(todo.priority || "");
  const [editRecurrence, setEditRecurrence] = useState(todo.recurrence_rule || "");
  const [showOptions, setShowOptions] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentCount, setCommentCount] = useState(0);
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

  useEffect(() => {
    const handleEnterEdit = () => setEditing(true);
    const el = document.querySelector(`[data-todo-id="${todo.id}"]`);
    el?.addEventListener("enter-edit", handleEnterEdit);
    return () => el?.removeEventListener("enter-edit", handleEnterEdit);
  }, [todo.id]);

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
      priority: editPriority || null,
      recurrence_rule: editRecurrence || null,
    });
    setEditing(false);
  };

  const cancelEdit = () => {
    setEditTitle(todo.title);
    setEditDueDate(todo.due_date?.split("T")[0] || "");
    setEditDuration(todo.duration_minutes?.toString() || "");
    setEditPriority(todo.priority || "");
    setEditRecurrence(todo.recurrence_rule || "");
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

  const handleLabelSelectionChange = async (selectedIds: string[]) => {
    onTodoLabelIdsChange(todo.id, selectedIds);
    try {
      await setTodoLabels(todo.id, selectedIds);
    } catch (e) {
      console.error("Failed to update labels", e);
    }
  };

  const selectedLabels = labels.filter((l) => todoLabelIds.includes(l.id));
  const priorityColor = getPriorityColor(todo.priority);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={`py-md px-lg hover:bg-surface-variant/50 transition-colors group rounded-xl ${isSelected ? "bg-primary/8 ring-1 ring-primary/20" : ""}`}
    >
      <div className="flex items-center gap-md">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-on-surface-variant/40 hover:text-on-surface-variant transition-colors shrink-0 touch-none"
        >
          <span className="material-symbols-outlined text-[18px]">drag_indicator</span>
        </div>

        {priorityColor && (
          <div
            className="w-1.5 h-8 rounded-full shrink-0"
            style={{ backgroundColor: priorityColor }}
          />
        )}

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
              className="w-full h-8 px-2 rounded-lg tactile-input font-body-md"
            />
            <div className="flex gap-sm flex-wrap items-center">
              <input
                type="date"
                value={editDueDate}
                onChange={(e) => setEditDueDate(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 tactile-input-inline text-[12px]"
              />
              <select
                value={editDuration}
                onChange={(e) => setEditDuration(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 tactile-input-inline text-[12px] min-w-[80px]"
              >
                <option value="">Duration</option>
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{formatDuration(d)}</option>
                ))}
              </select>
              <select
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 tactile-input-inline text-[12px] min-w-[80px]"
              >
                <option value="">Priority</option>
                {PRIORITIES.map((p) => (
                  <option key={p.name} value={p.name}>{p.label}</option>
                ))}
              </select>
              <select
                value={editRecurrence}
                onChange={(e) => setEditRecurrence(e.target.value)}
                onMouseDown={(e) => e.stopPropagation()}
                className="h-7 tactile-input-inline text-[12px] min-w-[120px]"
              >
                <option value="">No repeat</option>
                {RECURRENCE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-sm mt-xs">
              <LabelPicker
                labels={labels}
                selectedLabelIds={todoLabelIds}
                onSelectionChange={handleLabelSelectionChange}
                onLabelsChange={onLabelsChange}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-sm">
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
              {todo.recurrence_rule && (
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant/50">
                  repeat
                </span>
              )}
            </div>
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
              {todo.recurrence_rule && (
                <span className="font-label-sm text-on-surface-variant/60">
                  {formatRecurrence(todo.recurrence_rule)}
                </span>
              )}
              {selectedLabels.map((l) => (
                <LabelBadge key={l.id} label={l} />
              ))}
            </div>
          </div>
        )}

        {!editing && (
          <div className="relative flex items-center gap-xs">
            <button
              onClick={() => setExpanded(!expanded)}
              className="opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-on-surface p-sm rounded-lg hover:bg-surface-variant"
              aria-label="Toggle comments"
            >
              <span className="material-symbols-outlined text-[16px]">
                {expanded ? "expand_less" : "expand_more"}
              </span>
            </button>
            {depth === 0 && (
              <button
                onClick={() => onAddSubTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-on-surface p-sm rounded-lg hover:bg-surface-variant"
                aria-label="Add sub-task"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
              </button>
            )}
            <div ref={optionsRef}>
              <button
                onClick={() => setShowOptions(!showOptions)}
                className="opacity-0 group-hover:opacity-100 transition-all text-on-surface-variant hover:text-on-surface p-sm rounded-lg hover:bg-surface-variant"
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
                    className="absolute right-0 top-full mt-1 bg-surface rounded-xl p-sm z-10 min-w-[120px]"
                    style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}
                  >
                    <button
                      onClick={() => {
                        setEditing(true);
                        setShowOptions(false);
                      }}
                      className="w-full flex items-center gap-sm px-md py-sm rounded-lg hover:bg-surface-variant text-on-surface-variant text-[13px] font-medium transition-colors"
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
          </div>
        )}
      </div>

      <AnimatePresence>
        {expanded && !editing && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pl-[68px]"
          >
            <CommentSection
              todoId={todo.id}
              commentCount={commentCount}
              onCommentCountChange={setCommentCount}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
