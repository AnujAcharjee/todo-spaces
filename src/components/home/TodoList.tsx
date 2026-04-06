"use client";

import {
  useEffect,
  useId,
  useRef,
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

const GROUP_TITLE_SINGLE_LINE_WIDTH = 136;
const FALLBACK_GROUP_TITLE_MAX_LENGTH = 22;
// 320px mobile viewport minus page/panel/card padding, checkbox width, and gap.
const MOBILE_TODO_TITLE_SINGLE_LINE_WIDTH = 206;
const FALLBACK_TODO_TITLE_MAX_LENGTH = 40;

type PendingDelete =
  | {
      kind: "group";
      groupId: string;
      label: string;
    }
  | {
      kind: "todo";
      groupId: string;
      todoId: string;
      label: string;
    }
  | null;

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
  const [isEditingGroupDescription, setIsEditingGroupDescription] =
    useState(false);
  const [groupDescriptionDraft, setGroupDescriptionDraft] = useState("");
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isSavingTodo, setIsSavingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);
  const [todoFormValues, setTodoFormValues] =
    useState<TodoFormValues>(EMPTY_TODO_FORM);

  const groupTitleId = useId();
  const groupDescriptionId = useId();
  const todoTitleId = useId();
  const todoDescriptionId = useId();
  const groupTitleMeasureRef = useRef<HTMLSpanElement>(null);
  const todoTitleMeasureRef = useRef<HTMLSpanElement>(null);

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
    setIsEditingGroupDescription(false);
    setGroupDescriptionDraft(activeGroup?.description ?? "");
  }, [activeGroup?.id, activeGroup?.title, activeGroup?.description]);

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

  const getFittingGroupTitle = (value: string) => {
    const normalizedValue = value.replace(/\r?\n/g, " ");
    const measureNode = groupTitleMeasureRef.current;

    if (!measureNode) {
      return normalizedValue.slice(0, FALLBACK_GROUP_TITLE_MAX_LENGTH);
    }

    let fittedValue = "";

    for (const character of normalizedValue) {
      const candidate = fittedValue + character;
      measureNode.textContent = candidate || " ";

      if (measureNode.scrollWidth > GROUP_TITLE_SINGLE_LINE_WIDTH) {
        break;
      }

      fittedValue = candidate;
    }

    return fittedValue;
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

  const commitGroupDescription = () => {
    if (!activeGroupId) {
      return;
    }

    updateGroup(activeGroupId, { description: groupDescriptionDraft });
    setIsEditingGroupDescription(false);
  };

  const handleGroupDescriptionKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === "Escape") {
      event.preventDefault();
      setGroupDescriptionDraft(activeGroup?.description ?? "");
      setIsEditingGroupDescription(false);
    }

    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      commitGroupDescription();
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

  const handleDeleteSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!pendingDelete) {
      return;
    }

    if (pendingDelete.kind === "group") {
      deleteGroup(pendingDelete.groupId);
      onDeleteGroup(pendingDelete.groupId);
    } else {
      deleteTodo(pendingDelete.groupId, pendingDelete.todoId);
    }

    setPendingDelete(null);
  };

  const getFittingTodoTitle = (value: string) => {
    const normalizedValue = value.replace(/\r?\n/g, " ");
    const measureNode = todoTitleMeasureRef.current;

    if (!measureNode) {
      return normalizedValue.slice(0, FALLBACK_TODO_TITLE_MAX_LENGTH);
    }

    let fittedValue = "";

    for (const character of normalizedValue) {
      const candidate = fittedValue + character;
      measureNode.textContent = candidate || " ";

      if (measureNode.scrollWidth > MOBILE_TODO_TITLE_SINGLE_LINE_WIDTH) {
        break;
      }

      fittedValue = candidate;
    }

    return fittedValue;
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
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                {isEditingGroupTitle ? (
                  <input
                    id={groupTitleId}
                    autoFocus
                    value={groupTitleDraft}
                    onChange={(event) =>
                      setGroupTitleDraft(
                        getFittingGroupTitle(event.target.value),
                      )
                    }
                    onBlur={commitGroupTitle}
                    onKeyDown={handleGroupTitleKeyDown}
                    className="w-full rounded-2xl border border-white/15 bg-white/[0.06] px-3 py-2 text-xl font-semibold text-white outline-none transition focus:border-white/25"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setIsEditingGroupTitle(true)}
                    className="group flex w-full min-w-0 items-center gap-2 text-left"
                  >
                    <span className="block min-w-0 flex-1 truncate text-2xl font-semibold text-white">
                      {activeGroup.title}
                    </span>
                    <span className="sr-only">Rename group</span>
                    <i className="bi bi-pencil-square text-sm text-white/40 transition group-hover:text-white/70" />
                  </button>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <div className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-white/55">
                  {todos.length} todo{todos.length === 1 ? "" : "s"}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-sm text-white/70 transition hover:bg-white/[0.08] hover:text-white"
                  title="Hide todo list"
                  aria-label="Hide todo list"
                >
                  <i className="bi bi-eye-slash" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setPendingDelete({
                      kind: "group",
                      groupId: activeGroup.id,
                      label: activeGroup.title,
                    })
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-200/12 bg-red-400/[0.06] text-sm text-red-100 transition hover:bg-red-400/[0.1]"
                  title="Delete group"
                  aria-label="Delete group"
                >
                  <i className="bi bi-trash3" />
                </button>
              </div>
            </div>

            {isEditingGroupDescription ? (
              <textarea
                id={groupDescriptionId}
                autoFocus
                rows={3}
                value={groupDescriptionDraft}
                onChange={(event) =>
                  setGroupDescriptionDraft(event.target.value)
                }
                onBlur={commitGroupDescription}
                onKeyDown={handleGroupDescriptionKeyDown}
                placeholder="Add a short description for this group"
                className="w-full resize-none rounded-2xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-white/35 focus:border-white/25 focus:bg-white/[0.08]"
              />
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingGroupDescription(true)}
                className="group w-full rounded-2xl text-left outline-none"
                aria-label="Edit group description"
              >
                <span className="block w-full break-words whitespace-pre-wrap text-sm leading-6 text-white/55 transition group-hover:text-white/75">
                  {activeGroup.description ||
                    "No description added for this group."}
                </span>
              </button>
            )}
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
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
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
                              "mt-1.5 text-xs leading-5 break-words whitespace-pre-wrap [overflow-wrap:anywhere] sm:text-sm",
                              todo.isDone ? "text-white/40" : "text-white/65",
                            ].join(" ")}
                          >
                            {todo.description || "No details added."}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-1.5 self-start sm:self-auto">
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
                            onClick={() =>
                              setPendingDelete({
                                kind: "todo",
                                groupId: activeGroup.id,
                                todoId: todo.id,
                                label: todo.title,
                              })
                            }
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
        <FormField
          label="Title"
          htmlFor={todoTitleId}
          hint="Title stops when it would overflow one line in the todo card."
        >
          <input
            id={todoTitleId}
            autoFocus
            value={todoFormValues.title}
            onChange={(event) =>
              setTodoFormValues((current) => ({
                ...current,
                title: getFittingTodoTitle(event.target.value),
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

      <Modal
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.kind === "group"
            ? "Delete this group?"
            : "Delete this todo?"
        }
        description="This action is permanent and cannot be undone."
        submitLabel={
          pendingDelete?.kind === "group" ? "Delete Group" : "Delete Todo"
        }
        onClose={() => setPendingDelete(null)}
        onSubmit={handleDeleteSubmit}
      >
        <p className="text-sm leading-6 text-white/70">
          {pendingDelete?.kind === "group"
            ? `Are you sure you want to delete "${pendingDelete.label}" and all of its todos?`
            : `Are you sure you want to delete "${pendingDelete?.label}"?`}
        </p>
      </Modal>

      <span
        ref={groupTitleMeasureRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 whitespace-nowrap text-sm font-semibold opacity-0"
      />
      <span
        ref={todoTitleMeasureRef}
        aria-hidden="true"
        className="pointer-events-none fixed left-[-9999px] top-0 whitespace-nowrap text-sm font-semibold opacity-0"
      />
    </>
  );
}
