"use client";

import { useState, useEffect, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { motion, AnimatePresence } from "motion/react";
import { Todo, Project } from "@/lib/types";
import { addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } from "@/lib/todos";
import { DURATIONS, PRIORITIES, RECURRENCE_OPTIONS, formatDuration } from "@/lib/constants";
import TodoItem from "./TodoItem";
import ProjectSidebar from "./ProjectSidebar";

interface TodoListProps {
  initialTodos: Todo[];
  initialProjects: Project[];
  userId: string;
}

type ViewTab = "inbox" | "today" | "upcoming" | "all";

export default function TodoList({ initialTodos, initialProjects, userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewTab>("inbox");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [showFormOptions, setShowFormOptions] = useState(false);
  const [formDueDate, setFormDueDate] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPriority, setFormPriority] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("");
  const [toast, setToast] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const input = document.querySelector<HTMLInputElement>('input[placeholder="What needs to be done?"]');

      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        input?.focus();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const firstActive = todos.find((t) => !t.completed && !t.parent_id);
        if (firstActive) handleToggle(firstActive.id, true);
      }

      if (e.key === "Escape" && document.activeElement === input) {
        input?.blur();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [todos]);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekEnd = new Date(todayStart);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const rootTodos = useMemo(() => todos.filter((t) => !t.parent_id), [todos]);

  const filteredTodos = useMemo(() => {
    let result = rootTodos;

    if (view === "inbox") {
      result = result.filter((t) => !t.project_id);
    } else if (view === "today") {
      result = result.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= todayStart && d < todayEnd;
      });
    } else if (view === "upcoming") {
      result = result.filter((t) => {
        if (!t.due_date) return false;
        const d = new Date(t.due_date);
        return d >= todayStart && d < weekEnd;
      });
    }

    if (selectedProjectId) {
      result = result.filter((t) => t.project_id === selectedProjectId);
    }

    return result;
  }, [rootTodos, view, selectedProjectId, todayStart, todayEnd, weekEnd]);

  const activeCount = rootTodos.filter((t) => !t.completed).length;
  const completedCount = rootTodos.filter((t) => t.completed).length;

  const todoCounts = useMemo(() => {
    const counts: Record<string, number> = { inbox: 0 };
    rootTodos.forEach((t) => {
      if (!t.completed) {
        if (!t.project_id) counts.inbox++;
        else counts[t.project_id] = (counts[t.project_id] || 0) + 1;
      }
    });
    return counts;
  }, [rootTodos]);

  const getSubTodos = (parentId: string) =>
    todos.filter((t) => t.parent_id === parentId);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = rootTodos.findIndex((t) => t.id === active.id);
    const newIndex = rootTodos.findIndex((t) => t.id === over.id);

    setTodos(arrayMove(todos, oldIndex, newIndex));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = newTodo.trim();
    if (!title) {
      setError("Title can't be empty");
      return;
    }

    setLoading(true);

    try {
      const data = await addTodo(title, {
        due_date: formDueDate ? new Date(formDueDate).toISOString() : null,
        duration_minutes: formDuration ? parseInt(formDuration) : null,
        priority: formPriority || null,
        recurrence_rule: formRecurrence || null,
        project_id: selectedProjectId,
      });
      setTodos([data, ...todos]);
      setNewTodo("");
      setFormDueDate("");
      setFormDuration("");
      setFormPriority("");
      setFormRecurrence("");
      setShowFormOptions(false);
      setToast("Todo added");
    } catch {
      setError("Failed to add todo.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleTodo(id, completed);
      setTodos(todos.map((t) => (t.id === id ? { ...t, completed } : t)));
      setToast(completed ? "Marked complete" : "Marked active");
    } catch {
      setError("Failed to update todo.");
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Todo>) => {
    try {
      await updateTodo(id, updates);
      setTodos(todos.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    } catch {
      setError("Failed to update todo.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTodo(id);
      setTodos(todos.filter((t) => t.id !== id && t.parent_id !== id));
      setToast("Todo deleted");
    } catch {
      setError("Failed to delete todo.");
    }
  };

  const handleClearCompleted = async () => {
    if (!confirm("Delete all completed todos?")) return;
    try {
      await clearCompleted();
      const count = completedCount;
      setTodos(todos.filter((t) => !t.completed));
      setToast(`Cleared ${count} completed`);
    } catch {
      setError("Failed to clear completed todos.");
    }
  };

  const handleAddSubTodo = async (parentId: string) => {
    try {
      const data = await addTodo("New sub-task", { parent_id: parentId });
      setTodos([...todos, data]);
      setToast("Sub-task added");
    } catch {
      setError("Failed to add sub-task.");
    }
  };

  const hasFormOptions = formDueDate || formDuration || formPriority || formRecurrence;

  const viewTabs: { id: ViewTab; label: string; icon: string }[] = [
    { id: "inbox", label: "Inbox", icon: "inbox" },
    { id: "today", label: "Today", icon: "today" },
    { id: "upcoming", label: "Upcoming", icon: "date_range" },
    { id: "all", label: "All", icon: "checklist" },
  ];

  return (
    <div className="flex gap-lg">
      <aside className="w-48 shrink-0 hidden md:block">
        <div className="bg-surface rounded-3xl p-lg" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
          <div className="mb-md">
            <p className="font-label-sm text-on-surface-variant/60 uppercase tracking-wider mb-sm px-md">Views</p>
            <div className="space-y-xs">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setView(tab.id); setSelectedProjectId(null); }}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium transition-colors ${
                    view === tab.id && !selectedProjectId
                      ? "bg-primary/10 text-primary"
                      : "text-on-surface-variant hover:bg-surface-variant"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <div className="border-t border-outline-variant/30 pt-md">
            <p className="font-label-sm text-on-surface-variant/60 uppercase tracking-wider mb-sm px-md">Projects</p>
            <ProjectSidebar
              projects={projects}
              selectedProjectId={selectedProjectId}
              onSelectProject={(id) => { setSelectedProjectId(id); setView("inbox"); }}
              onProjectsChange={setProjects}
              todoCounts={todoCounts}
            />
          </div>
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <div className="bg-surface rounded-3xl p-xl" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="flex items-center gap-sm bg-primary/10 text-primary rounded-xl p-md font-label-md overflow-hidden"
              >
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex md:hidden gap-xs mb-md overflow-x-auto">
            {viewTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setView(tab.id); setSelectedProjectId(null); }}
                className={`flex items-center gap-xs px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                  view === tab.id && !selectedProjectId
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mb-lg">
            <div className="flex gap-md">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={newTodo}
                  onChange={(e) => {
                    setNewTodo(e.target.value);
                    setError("");
                  }}
                  placeholder="What needs to be done?"
                  className="w-full h-12 px-4 rounded-xl tactile-input font-body-md"
                />
              </div>
              <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.95 }}
                className="h-12 px-6 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-xl font-button text-on-primary shadow-sm disabled:opacity-50 flex items-center gap-sm"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                {loading ? "Adding..." : "Add"}
              </motion.button>
            </div>

            <div className="flex items-center gap-sm mt-sm">
              <button
                type="button"
                onClick={() => setShowFormOptions(!showFormOptions)}
                className={`flex items-center gap-xs px-sm py-xs rounded-lg text-[12px] font-medium transition-colors ${
                  hasFormOptions
                    ? "text-primary bg-primary/10"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {hasFormOptions ? "check_circle" : "add_circle"}
                </span>
                Options
              </button>
              {hasFormOptions && (
                <button
                  type="button"
                  onClick={() => {
                    setFormDueDate("");
                    setFormDuration("");
                    setFormPriority("");
                    setFormRecurrence("");
                  }}
                  className="text-[12px] text-on-surface-variant hover:text-error transition-colors"
                >
                  Clear
                </button>
              )}
            </div>

            <AnimatePresence>
              {showFormOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-md flex gap-sm flex-wrap items-center">
                    <input
                      type="date"
                      value={formDueDate}
                      onChange={(e) => setFormDueDate(e.target.value)}
                      className="h-8 tactile-input-inline text-[12px]"
                    />
                    <select
                      value={formDuration}
                      onChange={(e) => setFormDuration(e.target.value)}
                      className="h-8 tactile-input-inline text-[12px] min-w-[100px]"
                    >
                      <option value="">Duration</option>
                      {DURATIONS.map((d) => (
                        <option key={d} value={d}>{formatDuration(d)}</option>
                      ))}
                    </select>
                    <select
                      value={formPriority}
                      onChange={(e) => setFormPriority(e.target.value)}
                      className="h-8 tactile-input-inline text-[12px] min-w-[100px]"
                    >
                      <option value="">Priority</option>
                      {PRIORITIES.map((p) => (
                        <option key={p.name} value={p.name}>{p.label}</option>
                      ))}
                    </select>
                    <select
                      value={formRecurrence}
                      onChange={(e) => setFormRecurrence(e.target.value)}
                      className="h-8 tactile-input-inline text-[12px] min-w-[120px]"
                    >
                      <option value="">No repeat</option>
                      {RECURRENCE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center gap-sm bg-error-container/30 rounded-xl p-md overflow-hidden"
              >
                <span className="material-symbols-outlined text-[18px] text-error">
                  error
                </span>
                <p className="font-label-md text-error">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {rootTodos.length > 0 && (
            <div className="flex items-center justify-between mb-md">
              <div className="flex items-center gap-sm">
                <span className="font-label-md text-on-surface-variant">
                  {filteredTodos.length} task{filteredTodos.length !== 1 ? "s" : ""}
                </span>
              </div>
              {completedCount > 0 && (
                <motion.button
                  onClick={handleClearCompleted}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-xs px-3 py-1.5 rounded-full text-[12px] font-medium text-error hover:bg-error-container/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
                  Clear done
                </motion.button>
              )}
            </div>
          )}

          {rootTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center py-2xl"
            >
              <span className="material-symbols-outlined text-[56px] text-on-surface-variant/40 mb-lg block">
                checklist
              </span>
              <p className="font-body-lg text-on-surface-variant/60">
                {view === "inbox" ? "Inbox is empty. Add a task above." : "No tasks here yet."}
              </p>
            </motion.div>
          ) : filteredTodos.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-xl"
            >
              <p className="font-body-md text-on-surface-variant/60">
                {view === "today" ? "Nothing due today." : view === "upcoming" ? "Nothing due this week." : "All done!"}
              </p>
            </motion.div>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={filteredTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                <div className="flex flex-col">
                  <AnimatePresence mode="popLayout">
                    {filteredTodos.map((todo) => {
                      const subTodos = getSubTodos(todo.id);
                      return (
                        <div key={todo.id}>
                          <TodoItem
                            todo={todo}
                            onToggle={handleToggle}
                            onDelete={handleDelete}
                            onUpdate={handleUpdate}
                            onAddSubTodo={handleAddSubTodo}
                          />
                          {subTodos.length > 0 && (
                            <div className="ml-12">
                              {subTodos.map((sub) => (
                                <div key={sub.id}>
                                  <TodoItem
                                    todo={sub}
                                    onToggle={handleToggle}
                                    onDelete={handleDelete}
                                    onUpdate={handleUpdate}
                                    onAddSubTodo={handleAddSubTodo}
                                    depth={1}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
