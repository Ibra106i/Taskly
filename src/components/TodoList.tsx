"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { Todo, Project, Label, Section } from "@/lib/types";
import { addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } from "@/lib/todos";
import { DURATIONS, PRIORITIES, RECURRENCE_OPTIONS, formatDuration } from "@/lib/constants";
import TodoItem from "./TodoItem";
import ProjectSidebar from "./ProjectSidebar";
import SectionComponent from "./Section";
import { addSection } from "@/lib/sections";
import KeyboardShortcutsModal from "./KeyboardShortcutsModal";

interface TodoListProps {
  initialTodos: Todo[];
  initialProjects: Project[];
  initialLabels: Label[];
  initialSections: Section[];
  initialTodoLabels: Record<string, string[]>;
}

type ViewTab = "inbox" | "today" | "upcoming" | "all";

export default function TodoList({
  initialTodos,
  initialProjects,
  initialLabels,
  initialSections,
  initialTodoLabels,
}: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [labels, setLabels] = useState<Label[]>(initialLabels);
  const [sections, setSections] = useState<Section[]>(initialSections);
  const [todoLabelsMap, setTodoLabelsMap] = useState<Record<string, string[]>>(initialTodoLabels);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<ViewTab>("inbox");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedLabelId, setSelectedLabelId] = useState<string | null>(null);
  const [showFormOptions, setShowFormOptions] = useState(false);
  const [formDueDate, setFormDueDate] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formPriority, setFormPriority] = useState("");
  const [formRecurrence, setFormRecurrence] = useState("");
  const [toast, setToast] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const isInputFocused = useCallback(() => {
    const el = document.activeElement;
    return el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.tagName === "SELECT" || (el as HTMLElement).isContentEditable);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const [dateRange, setDateRange] = useState({ todayStart: new Date(0), todayEnd: new Date(0), weekEnd: new Date(0) });

  useEffect(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const weekEnd = new Date(todayStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    setDateRange({ todayStart, todayEnd, weekEnd });
  }, []);

  const { todayStart, todayEnd, weekEnd } = dateRange;
  const rootTodos = useMemo(() => todos.filter((t) => !t.parent_id), [todos]);
  const completedCount = useMemo(() => todos.filter((t) => t.completed).length, [todos]);

  const filteredTodos = useMemo(() => {
    let result = rootTodos;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }

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

    if (selectedLabelId) {
      result = result.filter((t) => (todoLabelsMap[t.id] || []).includes(selectedLabelId));
    }

    return result;
  }, [rootTodos, searchQuery, view, selectedProjectId, selectedLabelId, todayStart, todayEnd, weekEnd, todoLabelsMap]);

  useEffect(() => {
    setSelectedIndex(-1);
  }, [searchQuery, view, selectedProjectId, selectedLabelId]);

  useEffect(() => {
    if (selectedIndex >= 0 && selectedIndex < filteredTodos.length) {
      const el = listRef.current?.querySelector(`[data-todo-id="${filteredTodos[selectedIndex].id}"]`);
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [selectedIndex, filteredTodos]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "/" && !isInputFocused()) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }

      if (e.key === "?" && !isInputFocused()) {
        e.preventDefault();
        setShowShortcuts((s) => !s);
        return;
      }

      if (e.key === "Escape") {
        if (showShortcuts) { setShowShortcuts(false); return; }
        if (searchQuery) { setSearchQuery(""); setSelectedIndex(-1); searchInputRef.current?.blur(); return; }
        if (isInputFocused()) { (document.activeElement as HTMLElement).blur(); return; }
      }

      if (isInputFocused()) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredTodos.length - 1));
        return;
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }

      if ((e.key === "Enter" || e.key === " ") && selectedIndex >= 0 && selectedIndex < filteredTodos.length) {
        e.preventDefault();
        const todo = filteredTodos[selectedIndex];
        handleToggle(todo.id, !todo.completed);
        return;
      }

      if (e.key === "e" && selectedIndex >= 0 && selectedIndex < filteredTodos.length) {
        e.preventDefault();
        const item = listRef.current?.querySelector(`[data-todo-id="${filteredTodos[selectedIndex].id}"]`);
        item?.dispatchEvent(new CustomEvent("enter-edit", { bubbles: true }));
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedIndex >= 0 && selectedIndex < filteredTodos.length) {
        e.preventDefault();
        const todo = filteredTodos[selectedIndex];
        if (confirm(`Delete "${todo.title}"?`)) {
          handleDelete(todo.id);
          setSelectedIndex((i) => Math.min(i, filteredTodos.length - 2));
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        const firstActive = todos.find((t) => !t.completed && !t.parent_id);
        if (firstActive) handleToggle(firstActive.id, true);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [todos, filteredTodos, selectedIndex, searchQuery, showShortcuts, isInputFocused]);

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
    } catch (e: unknown) {
      console.error("addTodo failed:", e instanceof Error ? e.message : e);
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

  const handleAddTodoToSection = async (title: string, sectionId: string) => {
    try {
      const data = await addTodo(title, {
        project_id: selectedProjectId,
        section_id: sectionId,
      });
      setTodos([data, ...todos]);
      setToast("Todo added");
    } catch {
      setError("Failed to add todo.");
    }
  };

  const handleAddSection = async () => {
    if (!selectedProjectId) return;
    try {
      const section = await addSection(selectedProjectId, "New Section");
      setSections([...sections, section]);
      setToast("Section added");
    } catch {
      setError("Failed to add section.");
    }
  };

  const handleTodoLabelIdsChange = (todoId: string, labelIds: string[]) => {
    setTodoLabelsMap((prev) => ({ ...prev, [todoId]: labelIds }));
  };

  const hasFormOptions = formDueDate || formDuration || formPriority || formRecurrence;

  const viewTabs: { id: ViewTab; label: string; icon: string }[] = [
    { id: "inbox", label: "Inbox", icon: "inbox" },
    { id: "today", label: "Today", icon: "today" },
    { id: "upcoming", label: "Upcoming", icon: "date_range" },
    { id: "all", label: "All", icon: "checklist" },
  ];

  const projectSections = useMemo(
    () => sections.filter((s) => s.project_id === selectedProjectId).sort((a, b) => a.position - b.position),
    [sections, selectedProjectId]
  );

  const unsectionedTodos = useMemo(
    () => filteredTodos.filter((t) => !t.section_id),
    [filteredTodos]
  );

  const sectionTodosMap = useMemo(() => {
    const map: Record<string, Todo[]> = {};
    projectSections.forEach((s) => {
      map[s.id] = filteredTodos.filter((t) => t.section_id === s.id);
    });
    return map;
  }, [filteredTodos, projectSections]);

  return (
    <div className="flex gap-lg">
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      <aside className="w-48 shrink-0 hidden md:block">
        <div className="bg-surface rounded-3xl p-lg" style={{ boxShadow: "0px 12px 32px rgba(113, 121, 118, 0.08)" }}>
          <div className="mb-md">
            <p className="font-label-sm text-on-surface-variant/60 uppercase tracking-wider mb-sm px-md">Views</p>
            <div className="space-y-xs">
              {viewTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => { setView(tab.id); setSelectedProjectId(null); setSelectedLabelId(null); }}
                  className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium transition-colors ${
                    view === tab.id && !selectedProjectId && !selectedLabelId
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
              onSelectProject={(id) => { setSelectedProjectId(id); setSelectedLabelId(null); setView("inbox"); }}
              onProjectsChange={setProjects}
              todoCounts={todoCounts}
            />
          </div>
          {labels.length > 0 && (
            <div className="border-t border-outline-variant/30 pt-md mt-md">
              <p className="font-label-sm text-on-surface-variant/60 uppercase tracking-wider mb-sm px-md">Labels</p>
              <div className="space-y-xs">
                {labels.map((label) => (
                  <button
                    key={label.id}
                    onClick={() => {
                      setSelectedLabelId(selectedLabelId === label.id ? null : label.id);
                      setSelectedProjectId(null);
                      setView("inbox");
                    }}
                    className={`w-full flex items-center gap-sm px-md py-sm rounded-lg text-[13px] font-medium transition-colors ${
                      selectedLabelId === label.id
                        ? "bg-primary/10 text-primary"
                        : "text-on-surface-variant hover:bg-surface-variant"
                    }`}
                  >
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: label.color }} />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}
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
                onClick={() => { setView(tab.id); setSelectedProjectId(null); setSelectedLabelId(null); }}
                className={`flex items-center gap-xs px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors whitespace-nowrap ${
                  view === tab.id && !selectedProjectId && !selectedLabelId
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative mb-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 text-[18px]">
              search
            </span>
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks..."
              className="w-full h-10 pl-10 pr-10 rounded-xl tactile-input text-sm"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
            {!searchQuery && (
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-on-surface-variant/40 border border-outline-variant/30 rounded px-1.5 py-0.5 font-mono">
                /
              </kbd>
            )}
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
                  {searchQuery && ` matching "${searchQuery}"`}
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
                {searchQuery ? `No tasks matching "${searchQuery}"` : view === "today" ? "Nothing due today." : view === "upcoming" ? "Nothing due this week." : "All done!"}
              </p>
            </motion.div>
          ) : selectedProjectId && projectSections.length > 0 ? (
            <div ref={listRef}>
              {projectSections.map((section) => (
                <SectionComponent
                  key={section.id}
                  section={section}
                  todos={sectionTodosMap[section.id] || []}
                  labels={labels}
                  todoLabelsMap={todoLabelsMap}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                  onAddTodo={handleAddTodoToSection}
                  onAddSubTodo={handleAddSubTodo}
                  onLabelsChange={setLabels}
                  onTodoLabelIdsChange={handleTodoLabelIdsChange}
                  onSectionChange={setSections}
                  allSections={sections}
                />
              ))}
              {unsectionedTodos.length > 0 && (
                <div className="mt-md">
                  <p className="text-sm font-medium text-on-surface-variant mb-sm">Unsectioned</p>
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={unsectionedTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-col">
                        <AnimatePresence mode="popLayout">
                          {unsectionedTodos.map((todo) => {
                            const subTodos = getSubTodos(todo.id);
                            return (
                              <div key={todo.id}>
                                <TodoItem
                                  todo={todo}
                                  labels={labels}
                                  todoLabelIds={todoLabelsMap[todo.id] || []}
                                  onToggle={handleToggle}
                                  onDelete={handleDelete}
                                  onUpdate={handleUpdate}
                                  onAddSubTodo={handleAddSubTodo}
                                  onLabelsChange={setLabels}
                                  onTodoLabelIdsChange={handleTodoLabelIdsChange}
                                  isSelected={false}
                                />
                                {subTodos.length > 0 && (
                                  <div className="ml-12">
                                    {subTodos.map((sub) => (
                                      <div key={sub.id}>
                                        <TodoItem
                                          todo={sub}
                                          labels={labels}
                                          todoLabelIds={todoLabelsMap[sub.id] || []}
                                          onToggle={handleToggle}
                                          onDelete={handleDelete}
                                          onUpdate={handleUpdate}
                                          onAddSubTodo={handleAddSubTodo}
                                          onLabelsChange={setLabels}
                                          onTodoLabelIdsChange={handleTodoLabelIdsChange}
                                          depth={1}
                                          isSelected={false}
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
                </div>
              )}
              <button
                onClick={handleAddSection}
                className="flex items-center gap-sm mt-md text-sm text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-base">add</span>
                Add section
              </button>
            </div>
          ) : (
            <div ref={listRef}>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={filteredTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  <div className="flex flex-col">
                    <AnimatePresence mode="popLayout">
                      {filteredTodos.map((todo, index) => {
                        const subTodos = getSubTodos(todo.id);
                        return (
                          <div key={todo.id} data-todo-id={todo.id}>
                            <TodoItem
                              todo={todo}
                              labels={labels}
                              todoLabelIds={todoLabelsMap[todo.id] || []}
                              onToggle={handleToggle}
                              onDelete={handleDelete}
                              onUpdate={handleUpdate}
                              onAddSubTodo={handleAddSubTodo}
                              onLabelsChange={setLabels}
                              onTodoLabelIdsChange={handleTodoLabelIdsChange}
                              isSelected={selectedIndex === index}
                            />
                            {subTodos.length > 0 && (
                              <div className="ml-12">
                                {subTodos.map((sub) => (
                                  <div key={sub.id}>
                                    <TodoItem
                                      todo={sub}
                                      labels={labels}
                                      todoLabelIds={todoLabelsMap[sub.id] || []}
                                      onToggle={handleToggle}
                                      onDelete={handleDelete}
                                      onUpdate={handleUpdate}
                                      onAddSubTodo={handleAddSubTodo}
                                      onLabelsChange={setLabels}
                                      onTodoLabelIdsChange={handleTodoLabelIdsChange}
                                      depth={1}
                                      isSelected={false}
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
