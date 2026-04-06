"use client";

import {
  useEffect,
  useId,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import type { Todo, TodoFormValues } from "@/@types";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { FloatingButton } from "@/components/ui/FloatingButton";
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useTodosStore } from "@/store/todo.store";

interface TodoListProps {
  activeGroupId: string | null;
  onDeleteGroup: (groupId: string) => void;
  onClose: () => void;
}

const EMPTY_TODO_FORM: TodoFormValues = {
  title: "",
  description: "",
};

export function TodoList({
  activeGroupId,
  onDeleteGroup,
  onClose,
}: TodoListProps) {
  const groups = useTodosStore((state) => state.groups);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);
  const updateGroup = useTodosStore((state) => state.updateGroup);
  const deleteGroup = useTodosStore((state) => state.deleteGroup);
  const addTodo = useTodosStore((state) => state.addTodo);
  const deleteTodo = useTodosStore((state) => state.deleteTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);

  const [isEditingGroupTitle, setIsEditingGroupTitle] = useState(false);
  const [groupTitleDraft, setGroupTitleDraft] = useState("");
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isSavingTodo, setIsSavingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [todoFormValues, setTodoFormValues] =
    useState<TodoFormValues>(EMPTY_TODO_FORM);

  const groupTitleId = useId();
  const todoTitleId = useId();
  const todoDescriptionId = useId();

  const activeGroup = activeGroupId ? groups[activeGroupId] : null;
  const todos = activeGroup
    ? Object.values(activeGroup.todos).sort((left, right) => {
        if (left.isDone !== right.isDone) {
          return Number(left.isDone) - Number(right.isDone);
        }

        return (
          new Date(right.updatedAt).getTime() -
          new Date(left.updatedAt).getTime()
        );
      })
    : [];

  useEffect(() => {
    setIsEditingGroupTitle(false);
    setGroupTitleDraft(activeGroup?.title ?? "");
  }, [activeGroup?.id, activeGroup?.title]);

  const closeTodoModal = () => {
    setIsTodoModalOpen(false);
    setEditingTodoId(null);
    setTodoFormValues({ ...EMPTY_TODO_FORM });
  };

  const openCreateTodo = () => {
    setEditingTodoId(null);
    setTodoFormValues(EMPTY_TODO_FORM);
    setIsTodoModalOpen(true);
  };

  const openEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setTodoFormValues({
      title: todo.title,
      description: todo.description,
    });
    setIsTodoModalOpen(true);
  };

  const commitGroupTitle = () => {
    if (!activeGroupId) {
      return;
    }

    const trimmedTitle = groupTitleDraft.trim();

    if (!trimmedTitle) {
      setGroupTitleDraft(activeGroup?.title ?? "");
      setIsEditingGroupTitle(false);
      return;
    }

    updateGroup(activeGroupId, { title: trimmedTitle });
    setIsEditingGroupTitle(false);
  };

  const handleGroupTitleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitGroupTitle();
    }

    if (event.key === "Escape") {
      setGroupTitleDraft(activeGroup?.title ?? "");
      setIsEditingGroupTitle(false);
    }
  };

  const handleTodoSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeGroupId) {
      return;
    }

    setIsSavingTodo(true);

    try {
      if (editingTodoId) {
        updateTodo(activeGroupId, editingTodoId, todoFormValues);
        closeTodoModal();
      } else {
        const todoId = addTodo(activeGroupId, todoFormValues);

        if (!todoId) {
          return;
        }

        closeTodoModal();
      }
    } finally {
      setIsSavingTodo(false);
    }
  };

  if (!hasHydrated) {
    return (
      <GlassPanel className="flex min-h-[20rem] items-center justify-center px-6 py-10">
        <div className="flex items-center gap-2 text-sm text-white/55">
          <i className="bi bi-arrow-repeat animate-spin" />
          Loading todos...
        </div>
      </GlassPanel>
    );
  }

  if (!activeGroupId) {
    return (
      <GlassPanel className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-10 text-center">
        <i className="bi bi-journal-richtext text-4xl text-white/35" />
        <p className="mt-4 text-lg font-semibold text-white/80">
          Pick a group to see its todos
        </p>
        <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
          Your selected group opens here, with inline rename, delete controls,
          and the active todo list.
        </p>
      </GlassPanel>
    );
  }

  if (!activeGroup) {
    return (
      <GlassPanel className="flex min-h-[24rem] flex-col items-center justify-center px-6 py-10 text-center">
        <i className="bi bi-exclamation-circle text-4xl text-white/35" />
        <p className="mt-4 text-lg font-semibold text-white/80">
          This group was removed
        </p>
        <p className="mt-2 text-sm text-white/50">
          Select another group from the list to continue.
        </p>
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel className="flex h-full min-h-0 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-white/10 px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              {isEditingGroupTitle ? (
                <input
                  id={groupTitleId}
                  autoFocus
                  value={groupTitleDraft}
                  onChange={(event) => setGroupTitleDraft(event.target.value)}
                  onBlur={commitGroupTitle}
                  onKeyDown={handleGroupTitleKeyDown}
                  className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xl font-semibold text-white outline-none transition focus:border-white/25"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingGroupTitle(true)}
                  className="group flex items-center gap-2 text-left"
                >
                  <span className="truncate text-2xl font-semibold text-white">
                    {activeGroup.title}
                  </span>
                  <i className="bi bi-pencil-square text-sm text-white/40 transition group-hover:text-white/70" />
                </button>
              )}

              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/55">
                {activeGroup.description ||
                  "No description added for this group."}
              </p>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
                {todos.length} todo{todos.length === 1 ? "" : "s"}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                title="Hide todo list"
                aria-label="Hide todo list"
              >
                <i className="bi bi-eye-slash" />
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteGroup(activeGroup.id);
                  onDeleteGroup(activeGroup.id);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200/12 bg-red-400/[0.06] text-sm text-red-100 transition hover:bg-red-400/[0.1]"
                title="Delete group"
                aria-label="Delete group"
              >
                <i className="bi bi-trash3" />
              </button>
            </div>
          </div>
        </div>

        <div className="transparent-scrollbar min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
          {todos.length === 0 ? (
            <div className="flex h-full min-h-56 flex-col items-center justify-center text-center">
              <i className="bi bi-card-checklist text-4xl text-white/30" />
              <p className="mt-4 text-lg font-semibold text-white/80">
                No todos in this group yet
              </p>
              <p className="mt-2 max-w-md text-sm leading-6 text-white/50">
                Use the add button below to create the first todo for this
                group.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {todos.map((todo) => (
                <article
                  key={todo.id}
                  className={[
                    "rounded-xl border px-3 py-3 transition",
                    todo.isDone
                      ? "border-white/6 bg-white/[0.03] opacity-70"
                      : "border-white/10 bg-white/[0.05] hover:bg-white/[0.08]",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2.5">
                    <button
                      type="button"
                      onClick={() =>
                        updateTodo(activeGroup.id, todo.id, {
                          isDone: !todo.isDone,
                        })
                      }
                      className={[
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition",
                        todo.isDone
                          ? "border-white/70 bg-white/80 text-slate-900"
                          : "border-white/25 bg-transparent text-white/30 hover:border-white/45",
                      ].join(" ")}
                      aria-label={
                        todo.isDone
                          ? "Mark todo as pending"
                          : "Mark todo as done"
                      }
                    >
                      {todo.isDone ? (
                        <i className="bi bi-check text-sm" />
                      ) : null}
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h3
                            className={[
                              "truncate text-sm font-semibold sm:text-base",
                              todo.isDone
                                ? "text-white/55 line-through"
                                : "text-white",
                            ].join(" ")}
                          >
                            {todo.title}
                          </h3>
                          <p
                            className={[
                              "mt-1.5 text-xs leading-5 sm:text-sm",
                              todo.isDone ? "text-white/40" : "text-white/65",
                            ].join(" ")}
                          >
                            {todo.description || "No details added."}
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-white/35">
                            {new Date(todo.updatedAt).toLocaleDateString(
                              "en-GB",
                              {
                                day: "numeric",
                                month: "short",
                              },
                            )}
                          </span>
                          <button
                            type="button"
                            onClick={() => openEditTodo(todo)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04] text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                            title="Edit todo"
                            aria-label="Edit todo"
                          >
                            <i className="bi bi-pencil-square" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteTodo(activeGroup.id, todo.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 bg-white/[0.04] text-sm text-white/70 transition hover:bg-red-400/[0.1] hover:text-red-100"
                            title="Delete todo"
                            aria-label="Delete todo"
                          >
                            <i className="bi bi-trash3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-white/10 px-4 py-3 sm:px-5">
          <FloatingButton
            type="button"
            onClick={openCreateTodo}
            className="w-full sm:w-auto"
          >
            <i className="bi bi-plus-lg text-base" />
            <span>Add Todo</span>
          </FloatingButton>
        </div>
      </GlassPanel>

      <Modal
        open={isTodoModalOpen}
        title={editingTodoId ? "Edit todo" : "Add a todo"}
        description="Todos saved here, so your brain can finally take a break 😌"
        submitLabel={editingTodoId ? "Save Todo" : "Add Todo"}
        loading={isSavingTodo}
        onClose={closeTodoModal}
        onSubmit={handleTodoSubmit}
      >
        <FormField label="Title" htmlFor={todoTitleId}>
          <input
            id={todoTitleId}
            autoFocus
            value={todoFormValues.title}
            onChange={(event) =>
              setTodoFormValues((current) => ({
                ...current,
                title: event.target.value,
              }))
            }
            placeholder="Pay electricity bill"
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.08]"
          />
        </FormField>

        <FormField label="Description" htmlFor={todoDescriptionId}>
          <textarea
            id={todoDescriptionId}
            rows={4}
            value={todoFormValues.description}
            onChange={(event) =>
              setTodoFormValues((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            placeholder="Add any notes, context, or checklist details"
            className="rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.08]"
          />
        </FormField>
      </Modal>
    </>
  );
}
