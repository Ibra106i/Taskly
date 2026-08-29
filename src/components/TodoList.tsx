"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import TodoItem from "./TodoItem";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TodoListProps {
  initialTodos: Todo[];
  userId: string;
}

export default function TodoList({ initialTodos, userId }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>(initialTodos);
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const title = newTodo.trim();
    if (!title) {
      setError("Title can't be empty");
      return;
    }

    setLoading(true);

    const { data, error: insertError } = await supabase
      .from("todos")
      .insert({ title, user_id: userId })
      .select()
      .single();

    if (insertError) {
      setError("Failed to add todo. Please try again.");
      setLoading(false);
      return;
    }

    setTodos([data, ...todos]);
    setNewTodo("");
    setLoading(false);
  };

  const handleToggle = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from("todos")
      .update({ completed })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError("Failed to update todo.");
      return;
    }

    setTodos(todos.map((t) => (t.id === id ? { ...t, completed } : t)));
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("todos")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) {
      setError("Failed to delete todo.");
      return;
    }

    setTodos(todos.filter((t) => t.id !== id));
  };

  return (
    <div className="bg-surface-container-lowest rounded-3xl shadow-soft p-xl">
      <form onSubmit={handleSubmit} className="flex gap-md mb-lg">
        <div className="flex-1 relative">
          <input
            type="text"
            value={newTodo}
            onChange={(e) => {
              setNewTodo(e.target.value);
              setError("");
            }}
            placeholder="What needs to be done?"
            className="w-full h-12 pl-12 pr-4 rounded-xl bg-[#F7F5F0] border-none focus:ring-2 focus:ring-primary focus:outline-none transition-all shadow-inner-soft font-body-md placeholder-on-surface-variant/50"
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
      </form>

      {error && (
        <div className="flex items-center gap-sm bg-error-container/30 rounded-xl p-md mb-lg">
          <span className="material-symbols-outlined text-[18px] text-error">
            error
          </span>
          <p className="font-label-md text-error">{error}</p>
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
      ) : (
        <div className="flex flex-col">
          {todos.map((todo, index) => (
            <div key={todo.id}>
              <TodoItem
                todo={todo}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
              {index < todos.length - 1 && (
                <div className="h-px bg-[#F7F5F0] mx-lg" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
