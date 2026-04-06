"use client";

import { useState } from "react";
import { useTodosStore } from "@/store/todo.store";
import { TodoModal } from "@/components/home/TodoModal";
import type { Todo } from "@/@types";

interface TodoListProps {
  activeGroup: string | null;
}

export function TodoList({ activeGroup }: TodoListProps) {
  const groups = useTodosStore((state) => state.groups);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);
  const deleteTodo = useTodosStore((state) => state.deleteTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);

  const [editingTodo, setEditingTodo] = useState<Todo | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);

  const group = activeGroup ? groups[activeGroup] : null;
  const todosArray: Todo[] = group ? Object.values(group.todos) : [];

  const openEdit = (todo: Todo) => {
    setEditingTodo(todo);
    setEditingGroup(activeGroup);
    setEditText(todo.description);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTodo || !editingGroup || !editText.trim()) return;
    setSaving(true);
    try {
      updateTodo(editingGroup, editingTodo.id, {
        description: editText.trim(),
        updatedAt: new Date(),
      });
      setEditingTodo(null);
      setEditingGroup(null);
    } finally {
      setSaving(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="mt-16 flex items-center gap-2 text-white/50 text-sm">
        <i className="bi bi-arrow-repeat animate-spin" /> Loading…
      </div>
    );
  }

  if (!activeGroup) {
    return (
      <div className="mt-16 text-center text-white/40 text-sm">
        <i className="bi bi-inbox text-3xl block mb-2 opacity-50" />
        Select a group to view its tasks
      </div>
    );
  }

  if (!group) {
    return (
      <div className="mt-16 text-center text-white/40 text-sm">
        <i className="bi bi-inbox text-3xl block mb-2 opacity-50" />
        This group no longer exists
      </div>
    );
  }

  if (todosArray.length === 0) {
    return (
      <div className="mt-16 text-center text-white/40 text-sm">
        <i className="bi bi-inbox text-3xl block mb-2 opacity-50" />
        No tasks yet — add one above
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 min-h-0 w-full flex flex-col gap-2 overflow-y-auto pr-1">
        {todosArray.map((todo) => (
          <div
            key={todo.id}
            className={`group flex items-start gap-3 p-3.5 rounded-xl
              border border-white/15 bg-white/8 backdrop-blur-sm
              hover:bg-white/12 hover:border-white/25
              transition-all duration-200
              ${todo.isDone ? "opacity-60" : ""}`}
          >
            <button
              onClick={() =>
                updateTodo(activeGroup, todo.id, { isDone: !todo.isDone })
              }
              className={`mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                transition-all duration-200
                ${
                  todo.isDone
                    ? "bg-white/80 border-white/80"
                    : "border-white/30 hover:border-white/60 bg-transparent"
                }`}
            >
              {todo.isDone && (
                <i className="bi bi-check text-black text-xs font-bold" />
              )}
            </button>

            <p
              className={`flex-1 text-sm leading-relaxed pt-0.5
              ${todo.isDone ? "line-through text-white/40" : "text-white/90"}`}
            >
              {todo.description}
            </p>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              <span className="text-white/30 text-xs mr-1 hidden sm:block">
                {new Date(todo.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
              <button
                onClick={() => openEdit(todo)}
                className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-all"
                title="Edit"
              >
                <i className="bi bi-pencil text-xs" />
              </button>
              <button
                onClick={() => deleteTodo(activeGroup, todo.id)}
                className="p-1.5 rounded-lg text-white/50 hover:text-red-400 hover:bg-red-400/10 transition-all"
                title="Delete"
              >
                <i className="bi bi-trash text-xs" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editingTodo && (
        <TodoModal
          title="Edit task"
          onClose={() => {
            setEditingTodo(null);
            setEditingGroup(null);
          }}
          onSubmit={handleUpdate}
          loading={saving}
          submitLabel="Save"
        >
          <textarea
            autoFocus
            rows={3}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5
              text-white placeholder:text-white/40 text-sm resize-none
              focus:outline-none focus:border-white/50 focus:bg-white/10
              transition-all duration-200"
          />
        </TodoModal>
      )}
    </>
  );
}
