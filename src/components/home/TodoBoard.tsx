"use client";

import { useEffect, useState } from "react";
import { CreateList } from "@/components/home/CreateList";
import { GroupList } from "@/components/home/GroupList";
import { TodoList } from "@/components/home/TodoList";
import { BackgroundSelector } from "@/components/home/BackgroundSelector";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useTodosStore } from "@/store/todo.store";
import { useThemeStore } from "@/store/theme.store";

export function TodoBoard() {
  const groups = useTodosStore((state) => state.groups);
  const groupOrder = useTodosStore((state) => state.groupOrder);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);

  const backgroundUrl = useThemeStore((state) => state.backgroundUrl);
  const loadBackground = useThemeStore((state) => state.loadBackground);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [editingListId, setEditingListId] = useState<string | null>(null);

  // Load custom background from IndexedDB on mount
  useEffect(() => {
    loadBackground();
  }, [loadBackground]);

  // Auto-select first list once hydrated if none is selected
  useEffect(() => {
    if (hasHydrated && !selectedGroupId && groupOrder.length > 0) {
      const firstExisting = groupOrder.find((id) => groups[id]);
      if (firstExisting) {
        setSelectedGroupId(firstExisting);
      }
    }
  }, [hasHydrated, groupOrder, groups, selectedGroupId]);

  const activeGroupId =
    selectedGroupId && groups[selectedGroupId] ? selectedGroupId : null;

  const handleListCreated = (newId: string) => {
    setSelectedGroupId(newId);
    setEditingListId(newId);
  };

  const totalLists = Object.keys(groups).length;

  return (
    <main
      className="h-svh overflow-hidden bg-cover bg-center transition-[background-image] duration-500"
      style={{ backgroundImage: `url("${backgroundUrl}")` }}
    >
      <div className="h-full bg-slate-950/25 backdrop-blur-[1px]">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 p-3 md:flex-row md:gap-5 md:p-6">
          {/* LHS Sidebar: Lists */}
          <aside
            className={[
              "shrink-0 md:flex md:w-80 md:min-h-0 md:flex-col",
              activeGroupId ? "hidden md:flex" : "flex flex-1 min-h-0 flex-col",
            ].join(" ")}
          >
            <GlassPanel className="flex h-full flex-col gap-4 p-4 sm:p-5">
              {/* Branding / App Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10 p-1.5 text-white shadow-sm overflow-hidden">
                    <img
                      src="/favicon.svg"
                      alt="Todo Spaces Logo"
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold tracking-tight text-white">
                      Todo Spaces
                    </h1>
                  </div>
                </div>

                {/* Wallpaper / Background selector button */}
                <BackgroundSelector />
              </div>

              {/* Lists Section Title */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-white/50">
                    Lists
                  </span>
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/60">
                    {totalLists}
                  </span>
                </div>
              </div>

              {/* Lists Container */}
              <div className="min-h-0 flex-1">
                <GroupList
                  activeGroupId={activeGroupId}
                  onSelect={(id) => {
                    setSelectedGroupId(id);
                    setEditingListId(null);
                  }}
                  editingListId={editingListId}
                  onStartRename={(id) => setEditingListId(id)}
                  onFinishRename={() => setEditingListId(null)}
                />
              </div>

              {/* + New List Button */}
              <div className="mt-auto shrink-0 pt-2 border-t border-white/10">
                <CreateList
                  className="w-full"
                  onCreated={handleListCreated}
                />
              </div>
            </GlassPanel>
          </aside>

          {/* RHS Main View: Selected List Tasks */}
          <section
            className={[
              "min-h-0 flex-1 md:flex md:flex-col",
              activeGroupId ? "flex flex-col" : "hidden md:flex",
            ].join(" ")}
          >
            <TodoList
              activeGroupId={activeGroupId}
              onClose={() => setSelectedGroupId(null)}
              onDeleteGroup={(groupId) => {
                if (groupId === activeGroupId) {
                  const remaining = groupOrder.filter((id) => id !== groupId && groups[id]);
                  setSelectedGroupId(remaining.length > 0 ? remaining[0] : null);
                }
              }}
            />
          </section>
        </div>
      </div>
    </main>
  );
}
