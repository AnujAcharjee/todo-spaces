"use client";

import { useTodosStore } from "@/store/todo.store";

interface GroupListProps {
  activeGroupId: string | null;
  onSelect: (groupId: string) => void;
}

function truncateDescription(description: string, maxLength = 110) {
  const normalized = description.trim();

  if (!normalized) {
    return "No description yet";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}....`;
}

export function GroupList({ activeGroupId, onSelect }: GroupListProps) {
  const groups = useTodosStore((state) => state.groups);
  const groupOrder = useTodosStore((state) => state.groupOrder);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);

  const orderedGroups = groupOrder
    .map((groupId) => groups[groupId])
    .filter((group) => Boolean(group));

  if (!hasHydrated) {
    return (
      <div className="flex h-full items-center gap-2 px-1 py-3 text-sm text-white/55">
        <i className="bi bi-arrow-repeat animate-spin" />
        Loading groups...
      </div>
    );
  }

  if (orderedGroups.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center text-sm text-white/45">
        <i className="bi bi-collection block text-2xl text-white/35" />
        <p className="mt-2">Create your first group to start organizing todos.</p>
      </div>
    );
  }

  return (
    <div className="transparent-scrollbar flex gap-2 overflow-x-auto overflow-y-hidden pb-1 md:h-full md:flex-col md:overflow-x-hidden md:overflow-y-auto md:pb-0 md:pr-1">
      {orderedGroups.map((group) => {
        const todoCount = Object.keys(group.todos).length;
        const isActive = group.id === activeGroupId;

        return (
          <button
            key={group.id}
            type="button"
            onClick={() => onSelect(group.id)}
            className={[
              "flex h-24 w-52 shrink-0 flex-col rounded-2xl border px-4 py-3 text-left transition backdrop-blur-sm md:h-24 md:w-full md:min-w-0",
              isActive
                ? "border-white/20 bg-white/[0.1] shadow-inner shadow-white/5"
                : "border-white/8 bg-white/[0.04] hover:bg-white/[0.07]",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-sm font-semibold text-white">
                {group.title}
              </p>
              <span className="rounded-full bg-black/15 px-2 py-0.5 text-[11px] text-white/65">
                {todoCount}
              </span>
            </div>

            <p className="mt-2 overflow-hidden text-xs leading-4 text-white/55">
              {truncateDescription(group.description)}
            </p>
          </button>
        );
      })}
    </div>
  );
}
