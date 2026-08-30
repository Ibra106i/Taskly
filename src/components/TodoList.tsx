"use client";

import { useState, useEffect } from "react";
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
import { addTodo, toggleTodo, deleteTodo, updateTodo, clearCompleted } from "@/lib/todos";
import { CATEGORIES, DURATIONS, formatDuration } from "@/lib/constants";
import TodoItem from "./TodoItem";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
  due_date: string | null;
  duration_minutes: number | null;
  category: string | null;
}

interface TodoListProps {
  initialTodos: Todo[];
  userId: string;
}

type FilterTab = "all" | "active" | "completed";

export default function TodoList({ initialTodos, userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [showFormOptions, setShowFormOptions] = useState(false);
  const [formDueDate, setFormDueDate] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formCategory, setFormCategory] = useState("");
  const [toast, setToast] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "n") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>('input[placeholder="What needs to be done?"]');
        input?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 2000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const filteredTodos = todos.filter((t) => {
    if (filter === "active") return !t.completed;
    if (filter === "completed") return t.completed;
    return true;
  });

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = todos.findIndex((t) => t.id === active.id);
    const newIndex = todos.findIndex((t) => t.id === over.id);

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
        category: formCategory || null,
      });
      setTodos([data, ...todos]);
      setNewTodo("");
      setFormDueDate("");
      setFormDuration("");
      setFormCategory("");
      setShowFormOptions(false);
      setToast("Todo added");
    } catch {
      setError("Failed to add todo. Please try again.");
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

  const handleUpdate = async (id: string, updates: { title?: string; due_date?: string | null; duration_minutes?: number | null; category?: string | null }) => {
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
      setTodos(todos.filter((t) => t.id !== id));
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

  const hasFormOptions = formDueDate || formDuration || formCategory;

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-xl">
      {toast && (
        <div className="mb-lg flex items-center gap-sm bg-primary/10 text-primary rounded-xl p-md font-label-md animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="material-symbols-outlined text-[16px]">check_circle</span>
          {toast}
        </div>
      )}

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
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-background border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-inner-soft font-body-md placeholder-on-surface-variant/50"
              style={{ color: "#131d25", WebkitTextFillColor: "#131d25" }}
            />
            <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-outline-variant text-[20px]">
              add_task
            </span>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="h-12 px-6 bg-primary hover:bg-primary-container active:scale-[0.98] transition-all rounded-xl font-button text-on-primary shadow-sm disabled:opacity-50 flex items-center gap-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            {loading ? "Adding..." : "Add"}
          </button>
        </div>

        <div className="flex items-center gap-sm mt-sm">
          <button
            type="button"
            onClick={() => setShowFormOptions(!showFormOptions)}
            className={`flex items-center gap-xs px-sm py-xs rounded-lg text-[12px] font-medium transition-colors ${
              hasFormOptions
                ? "text-primary bg-primary/10"
                : "text-on-surface-variant hover:bg-background"
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
                setFormCategory("");
              }}
              className="text-[12px] text-on-surface-variant hover:text-error transition-colors"
            >
              Clear
            </button>
          )}
        </div>

        {showFormOptions && (
          <div className="flex gap-sm mt-sm flex-wrap items-center">
            <input
              type="date"
              value={formDueDate}
              onChange={(e) => setFormDueDate(e.target.value)}
              className="h-8 px-2 rounded-lg bg-background border-none shadow-inner-soft font-label-sm text-on-surface-variant focus:ring-2 focus:ring-primary focus:outline-none text-[12px]"
            />
            <select
              value={formDuration}
              onChange={(e) => setFormDuration(e.target.value)}
              className="h-8 px-2 rounded-lg bg-background border-none shadow-inner-soft font-label-sm text-on-surface-variant focus:ring-2 focus:ring-primary focus:outline-none text-[12px]"
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
                  onClick={() => setFormCategory(formCategory === cat.name ? "" : cat.name)}
                  className={`h-8 px-3 rounded-full text-[11px] font-medium transition-all ${
                    formCategory === cat.name
                      ? "text-on-primary"
                      : "text-on-surface-variant hover:opacity-80"
                  }`}
                  style={{
                    backgroundColor: formCategory === cat.name ? cat.color : `${cat.color}20`,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="flex items-center gap-sm bg-error-container/30 rounded-xl p-md mb-lg">
          <span className="material-symbols-outlined text-[18px] text-error">
            error
          </span>
          <p className="font-label-md text-error">{error}</p>
        </div>
      )}

      {todos.length > 0 && (
        <div className="flex items-center justify-between mb-md">
          <div className="flex gap-xs">
            {(["all", "active", "completed"] as FilterTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                  filter === tab
                    ? "bg-primary text-on-primary"
                    : "text-on-surface-variant hover:bg-background"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab === "active" && ` (${activeCount})`}
                {tab === "completed" && ` (${completedCount})`}
              </button>
            ))}
          </div>

          {completedCount > 0 && (
            <button
              onClick={handleClearCompleted}
              className="flex items-center gap-xs px-3 py-1.5 rounded-full text-[12px] font-medium text-error hover:bg-error-container/20 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">delete_sweep</span>
              Clear done
            </button>
          )}
        </div>
      )}

      {todos.length === 0 ? (
        <div className="text-center py-2xl">
          <span className="material-symbols-outlined text-[56px] text-outline-variant/40 mb-lg block">
            checklist
          </span>
          <p className="font-body-lg text-on-surface-variant/60">
            No todos yet. Add one above.
          </p>
        </div>
      ) : filteredTodos.length === 0 ? (
        <div className="text-center py-xl">
          <p className="font-body-md text-on-surface-variant/60">
            {filter === "active" ? "All done!" : "No completed todos yet."}
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={filteredTodos.map((t) => t.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col">
              {filteredTodos.map((todo, index) => (
                <div key={todo.id}>
                  <TodoItem
                    todo={todo}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onUpdate={handleUpdate}
                  />
                  {index < filteredTodos.length - 1 && (
                    <div className="h-px bg-background mx-lg" />
                  )}
                </div>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
