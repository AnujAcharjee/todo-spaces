"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import { useTodosStore } from "@/store/todo.store";

interface GroupListProps {
  activeGroupId: string | null;
  onSelect: (groupId: string) => void;
  editingListId?: string | null;
  onStartRename?: (groupId: string) => void;
  onFinishRename?: () => void;
}

export function GroupList({
  activeGroupId,
  onSelect,
  editingListId,
  onStartRename,
  onFinishRename,
}: GroupListProps) {
  const groups = useTodosStore((state) => state.groups);
  const groupOrder = useTodosStore((state) => state.groupOrder);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);
  const updateGroup = useTodosStore((state) => state.updateGroup);
  const deleteGroup = useTodosStore((state) => state.deleteGroup);

  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [titleDraft, setTitleDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activeEditingId = editingListId ?? inlineEditingId;

  const orderedGroups = groupOrder
    .map((groupId) => groups[groupId])
    .filter((group) => Boolean(group));

  useEffect(() => {
    if (activeEditingId && groups[activeEditingId]) {
      setTitleDraft(groups[activeEditingId].title);
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [activeEditingId, groups]);

  const handleStartRename = (groupId: string, event?: MouseEvent) => {
    event?.stopPropagation();
    setTitleDraft(groups[groupId]?.title ?? "");
    setInlineEditingId(groupId);
    onStartRename?.(groupId);
  };

  const handleSaveRename = (groupId: string) => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== groups[groupId]?.title) {
      updateGroup(groupId, { title: trimmed });
    }
    setInlineEditingId(null);
    onFinishRename?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>, groupId: string) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveRename(groupId);
    } else if (event.key === "Escape") {
      setInlineEditingId(null);
      onFinishRename?.();
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex h-full items-center justify-center gap-2 px-1 py-8 text-sm font-medium text-slate-200">
        <i className="bi bi-arrow-repeat animate-spin text-base" />
        <span>Loading lists...</span>
      </div>
    );
  }

  if (orderedGroups.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 bg-slate-950/30 p-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white/70 shadow-inner">
          <i className="bi bi-list-task text-2xl" />
        </div>
        <p className="mt-3 text-sm font-bold text-white">No lists yet</p>
        <p className="mt-1 text-xs text-slate-300">
          Create your first list to start organizing tasks.
        </p>
      </div>
    );
  }

  return (
    <div className="transparent-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden py-1 md:h-full md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pr-1">
      {orderedGroups.map((group) => {
        const todoList = Object.values(group.todos);
        const totalCount = todoList.length;
        const pendingCount = todoList.filter((t) => !t.isDone).length;
        const isActive = group.id === activeGroupId;
        const isEditing = activeEditingId === group.id;

        return (
          <div
            key={group.id}
            onClick={() => onSelect(group.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                onSelect(group.id);
              }
            }}
            className={[
              "group relative flex w-60 shrink-0 cursor-pointer items-center justify-between gap-2.5 rounded-2xl border p-3 text-left transition-all duration-200 ease-out backdrop-blur-md md:w-full",
              isActive
                ? "border-white/35 bg-white/[0.18] text-white shadow-lg shadow-black/30 ring-1 ring-white/20"
                : "border-white/10 bg-slate-900/45 text-slate-200 hover:border-white/25 hover:bg-slate-900/65 hover:text-white",
            ].join(" ")}
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className={[
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border text-sm transition",
                  isActive
                    ? "border-white/30 bg-white/20 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 group-hover:text-white",
                ].join(" ")}
              >
                <i className="bi bi-list-ul" />
              </span>

              <div className="min-w-0 flex-1">
                {isEditing ? (
                  <input
                    ref={inputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={() => handleSaveRename(group.id)}
                    onKeyDown={(e) => handleKeyDown(e, group.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full rounded-lg border border-white/30 bg-slate-900/90 px-2 py-1 text-sm font-bold text-white outline-none focus:border-white/60"
                  />
                ) : (
                  <span
                    onDoubleClick={(e) => handleStartRename(group.id, e)}
                    className="block truncate text-sm font-bold tracking-wide text-white"
                    title="Click to select, double-click to rename"
                  >
                    {group.title}
                  </span>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {!isEditing && (
                <button
                  type="button"
                  onClick={(e) => handleStartRename(group.id, e)}
                  className="hidden h-7 w-7 items-center justify-center rounded-lg text-xs text-white/50 transition hover:bg-white/20 hover:text-white group-hover:flex"
                  title="Rename list"
                  aria-label={`Rename ${group.title}`}
                >
                  <i className="bi bi-pencil" />
                </button>
              )}

              <span
                className={[
                  "rounded-full px-2 py-0.5 text-xs font-bold tabular-nums transition",
                  isActive
                    ? "bg-white/25 text-white"
                    : "bg-white/10 text-slate-200 group-hover:bg-white/20 group-hover:text-white",
                ].join(" ")}
                title={`${pendingCount} pending, ${totalCount} total`}
              >
                {totalCount}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
