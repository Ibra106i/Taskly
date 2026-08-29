"use client";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, completed: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TodoItem({ todo, onToggle, onDelete }: TodoItemProps) {
  return (
    <div className="flex items-center gap-md p-md rounded-xl hover:bg-[#F7F5F0] transition-colors group">
      <button
        onClick={() => onToggle(todo.id, !todo.completed)}
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          todo.completed
            ? "bg-primary border-primary"
            : "border-outline-variant hover:border-primary"
        }`}
      >
        {todo.completed && (
          <span className="material-symbols-outlined text-[14px] text-on-primary">
            check
          </span>
        )}
      </button>

      <span
        className={`flex-1 font-body-md transition-all ${
          todo.completed
            ? "text-on-surface-variant line-through"
            : "text-on-surface"
        }`}
      >
        {todo.title}
      </span>

      <button
        onClick={() => onDelete(todo.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error"
      >
        <span className="material-symbols-outlined text-[20px]">delete</span>
      </button>
    </div>
  );
}
