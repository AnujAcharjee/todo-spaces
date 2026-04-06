"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useTodosStore } from "@/store/todo.store";
import { TodoModal } from "@/components/home/TodoModal";

interface GroupListProps {
  activeGroup: string | null;
  onSelect: (groupName: string) => void;
  onDeletedActive: () => void;
}

export function GroupList({
  activeGroup,
  onSelect,
  onDeletedActive,
}: GroupListProps) {
  const groups = useTodosStore((state) => state.groups);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);
  const addGroup = useTodosStore((state) => state.addGroup);
  const deleteGroup = useTodosStore((state) => state.deleteGroup);

  const [showForm, setShowForm] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState("");

  const groupNames = Object.keys(groups);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = groupName.trim();
    if (!trimmed) return;
    if (groups[trimmed]) {
      setError("A group with this name already exists.");
      return;
    }
    addGroup(trimmed);
    setGroupName("");
    setError("");
    setShowForm(false);
    onSelect(trimmed);
  };

  const handleDelete = (name: string) => {
    deleteGroup(name);
    if (activeGroup === name) {
      onDeletedActive();
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="text-white/80 text-sm font-semibold tracking-wide uppercase">
          Groups
        </h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold
            bg-white/10 hover:bg-white/20 border border-white/20 text-white
            backdrop-blur-sm transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <i className="bi bi-plus-lg text-xs" />
          New
        </button>
      </div>

      {!hasHydrated ? (
        <div className="mt-4 flex items-center gap-2 text-white/50 text-sm">
          <i className="bi bi-arrow-repeat animate-spin" /> Loading…
        </div>
      ) : groupNames.length === 0 ? (
        <div className="mt-6 text-center text-white/40 text-sm">
          <i className="bi bi-inbox text-2xl block mb-2 opacity-50" />
          No groups yet
        </div>
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
          {groupNames.map((name) => {
            const isActive = activeGroup === name;
            const todoCount = Object.keys(groups[name]?.todos ?? {}).length;
            return (
              <div
                key={name}
                className={`group flex items-center justify-between gap-3 px-3 py-2 rounded-lg
                  border ${isActive ? "border-white/35" : "border-white/15"}
                  ${isActive ? "bg-white/15" : "bg-white/8"}
                  hover:bg-white/12 hover:border-white/25
                  transition-all duration-200`}
              >
                <button
                  onClick={() => onSelect(name)}
                  className="flex-1 text-left"
                >
                  <div className="text-white/90 text-sm font-medium">
                    {name}
                  </div>
                  <div className="text-white/40 text-xs">
                    {todoCount} task{todoCount === 1 ? "" : "s"}
                  </div>
                </button>
                <button
                  onClick={() => handleDelete(name)}
                  className="p-1.5 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  title="Delete group"
                >
                  <i className="bi bi-trash text-xs" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {showForm &&
        createPortal(
          <TodoModal
            title="Create group"
            onClose={() => {
              setShowForm(false);
              setError("");
            }}
            onSubmit={handleCreate}
            loading={false}
            submitLabel="Create"
          >
            <input
              autoFocus
              value={groupName}
              onChange={(e) => {
                setGroupName(e.target.value);
                setError("");
              }}
              placeholder="Group name"
              className="w-full bg-white/5 border border-white/20 rounded-lg px-3 py-2.5
                text-white placeholder:text-white/40 text-sm
                focus:outline-none focus:border-white/50 focus:bg-white/10
                transition-all duration-200"
            />
            {error && (
              <div className="text-xs text-red-300 -mt-2">{error}</div>
            )}
          </TodoModal>,
          document.body,
        )}
    </div>
  );
}
