"use client";

import { useState } from "react";
import { TodoList } from "@/components/home/TodoList";
import { CreateTodo } from "@/components/home/CreateTodo";
import { GroupList } from "@/components/home/GroupList";

export function TodoBoard() {
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <main className="flex h-[100svh] max-h-[100svh] w-full flex-col items-center bg-[url('/bg-freeren.png')] bg-cover bg-center overflow-hidden">
      <div
        className="flex items-center justify-between gap-4 w-full
          fixed top-0 z-10 px-6 py-3
          border-b border-white/10 bg-black/10 backdrop-blur-md"
      >
        <span className="text-xl font-bold tracking-widest text-white/90 uppercase font-mono">
          Tasks
        </span>
        <CreateTodo activeGroup={activeGroup} />
      </div>

      <div className="w-full max-w-6xl flex-1 min-h-0 pt-16 px-6 pb-6 flex gap-6">
        <aside className="w-72 shrink-0 min-h-0">
          <GroupList
            activeGroup={activeGroup}
            onSelect={(name) => setActiveGroup(name)}
            onDeletedActive={() => setActiveGroup(null)}
          />
        </aside>

        <section className="flex-1 min-h-0 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="text-white/80 text-sm uppercase tracking-widest">
              {activeGroup ? activeGroup : "No group selected"}
            </div>
          </div>
          <TodoList activeGroup={activeGroup} />
        </section>
      </div>
    </main>
  );
}
