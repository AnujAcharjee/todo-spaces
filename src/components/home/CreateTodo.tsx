"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTodosStore } from "@/store/todo.store";
import { TodoModal } from "@/components/home/TodoModal";

interface CreateTodoProps {
  activeGroup: string | null;
}

export function CreateTodo({ activeGroup }: CreateTodoProps) {
  const [showForm, setShowForm] = useState(false);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const addTodo = useTodosStore((state) => state.addTodo);

  const isDisabled = !activeGroup;

  const formSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !description.trim()) return;
    setLoading(true);
    try {
      const now = new Date();
      addTodo(activeGroup, {
        id: crypto.randomUUID(),
        title: "",
        description: description.trim(),
        createdAt: now,
        updatedAt: now,
        isDone: false,
      });
      setDescription("");
      setShowForm(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        disabled={isDisabled}
        title={isDisabled ? "Select a group first" : "Add a new task"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold
          bg-white/10 hover:bg-white/20 border border-white/20 text-white
          backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95
          disabled:opacity-40 disabled:hover:scale-100 disabled:cursor-not-allowed"
      >
        <i className="bi bi-plus-lg text-base" />
        New Task
      </button>

      {showForm && !isDisabled &&
        createPortal(
          <TodoModal
            title="Add new task"
            onClose={() => setShowForm(false)}
            onSubmit={formSubmit}
            loading={loading}
            submitLabel="Add Task"
          >
            <textarea
              autoFocus
              rows={3}
              placeholder="What needs to be done?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5
              text-white placeholder:text-white/40 text-sm resize-none
              focus:outline-none focus:border-white/50 focus:bg-white/10
              transition-all duration-200"
            />
          </TodoModal>,
          document.body, // renders outside the fixed navbar entirely
        )}
    </>
  );
}
