"use client";

import { useState } from "react";
import { CreateGroup } from "@/components/home/CreateGroup";
import { GroupList } from "@/components/home/GroupList";
import { TodoList } from "@/components/home/TodoList";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { useTodosStore } from "@/store/todo.store";

export function TodoBoard() {
  const groups = useTodosStore((state) => state.groups);

  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const activeGroupId =
    selectedGroupId && groups[selectedGroupId]
      ? selectedGroupId
      : null;

  return (
    <main className="h-svh overflow-hidden bg-[url('/bg-freeren.png')] bg-cover bg-center">
      <div className="h-full bg-slate-950/12">
        <div className="mx-auto flex h-full w-full max-w-7xl flex-col gap-4 p-3 md:flex-row md:gap-5 md:p-6">
          <section className="order-1 shrink-0 md:order-2 md:flex md:w-[23rem] md:min-h-0 md:flex-col">
            <GlassPanel className="flex h-full flex-col gap-3 p-4 sm:p-5">
              <div className="space-y-2">
                {/* <p className="text-xs uppercase tracking-[0.28em] text-white/35">
                  Groups
                </p> */}
                <h1 className="text-2xl font-semibold text-white">
                  Todo Spaces
                </h1>
                {/* <p className="text-sm leading-6 text-white/55">
                  Scroll across your groups, then open one to manage its todos.
                </p> */}
              </div>

              <div className="min-h-0 flex-1">
                <GroupList
                  activeGroupId={activeGroupId}
                  onSelect={setSelectedGroupId}
                />
              </div>

              <CreateGroup
                className="mt-auto hidden w-full md:inline-flex"
                onCreated={setSelectedGroupId}
              />
            </GlassPanel>
          </section>

          <section className="order-2 min-h-0 flex-1 md:order-1 md:min-h-0">
            {activeGroupId ? (
              <TodoList
                activeGroupId={activeGroupId}
                onClose={() => setSelectedGroupId(null)}
                onDeleteGroup={(groupId) => {
                  if (groupId === activeGroupId) {
                    setSelectedGroupId(null);
                  }
                }}
              />
            ) : null}
          </section>

          <section className="order-3 mt-auto shrink-0 px-1 pb-3 md:hidden">
            <GlassPanel className="p-3">
              <CreateGroup className="w-full" onCreated={setSelectedGroupId} />
            </GlassPanel>
          </section>
        </div>
      </div>
    </main>
  );
}
