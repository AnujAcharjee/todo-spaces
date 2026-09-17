"use client";

import { useTodosStore } from "@/store/todo.store";
import { FloatingButton } from "@/components/ui/FloatingButton";

interface CreateListProps {
  onCreated?: (groupId: string) => void;
  className?: string;
}

export function CreateList({ onCreated, className }: CreateListProps) {
  const createList = useTodosStore((state) => state.createList);

  const handleCreate = () => {
    const newId = createList();
    if (newId) {
      onCreated?.(newId);
    }
  };

  return (
    <FloatingButton
      type="button"
      onClick={handleCreate}
      className={className}
    >
      <i className="bi bi-plus-lg text-base" />
      <span>New List</span>
    </FloatingButton>
  );
}

// Backwards compatibility alias
export const CreateGroup = CreateList;
