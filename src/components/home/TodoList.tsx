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
import { FormField } from "@/components/ui/FormField";
import { Modal } from "@/components/ui/Modal";
import { useTodosStore } from "@/store/todo.store";

interface TodoListProps {
  activeGroupId: string | null;
  onDeleteGroup: (groupId: string) => void;
  onClose: () => void;
  autoFocusTitle?: boolean;
}

const EMPTY_TODO_FORM: TodoFormValues = {
  title: "",
  description: "",
};

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
  autoFocusTitle = false,
}: TodoListProps) {
  const groups = useTodosStore((state) => state.groups);
  const hasHydrated = useTodosStore((state) => state.hasHydrated);
  const updateGroup = useTodosStore((state) => state.updateGroup);
  const deleteGroup = useTodosStore((state) => state.deleteGroup);
  const addTodo = useTodosStore((state) => state.addTodo);
  const deleteTodo = useTodosStore((state) => state.deleteTodo);
  const updateTodo = useTodosStore((state) => state.updateTodo);
  const toggleStarTodo = useTodosStore((state) => state.toggleStarTodo);

  // Group title inline editing
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Quick Add Task bar state
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskNote, setQuickTaskNote] = useState("");
  const [isQuickAddExpanded, setIsQuickAddExpanded] = useState(false);
  const quickInputRef = useRef<HTMLInputElement>(null);

  // Completed section collapsible toggle
  const [showCompleted, setShowCompleted] = useState(true);

  // Edit Todo Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSavingTodo, setIsSavingTodo] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editFormValues, setEditFormValues] =
    useState<TodoFormValues>(EMPTY_TODO_FORM);

  // Delete modal state
  const [pendingDelete, setPendingDelete] = useState<PendingDelete>(null);

  const editTodoTitleId = useId();
  const editTodoDescriptionId = useId();

  const activeGroup = activeGroupId ? groups[activeGroupId] : null;

  useEffect(() => {
    if (activeGroup) {
      setTitleDraft(activeGroup.title);
      if (autoFocusTitle) {
        setIsEditingTitle(true);
      }
    }
  }, [activeGroup?.id, autoFocusTitle]);

  useEffect(() => {
    if (isEditingTitle) {
      setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
      }, 50);
    }
  }, [isEditingTitle]);

  const allTodos = activeGroup ? Object.values(activeGroup.todos) : [];

  // Sort unfinished todos: starred first, then by latest updated
  const unfinishedTodos = allTodos
    .filter((t) => !t.isDone)
    .sort((a, b) => {
      if (Boolean(a.isStarred) !== Boolean(b.isStarred)) {
        return a.isStarred ? -1 : 1;
      }
      return (
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      );
    });

  // Sort completed todos by latest updated
  const completedTodos = allTodos
    .filter((t) => t.isDone)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );

  const totalCount = allTodos.length;
  const completedCount = completedTodos.length;
  const pendingCount = unfinishedTodos.length;

  const handleSaveTitle = () => {
    if (!activeGroupId) return;
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== activeGroup?.title) {
      updateGroup(activeGroupId, { title: trimmed });
    } else {
      setTitleDraft(activeGroup?.title ?? "");
    }
    setIsEditingTitle(false);
  };

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      setTitleDraft(activeGroup?.title ?? "");
      setIsEditingTitle(false);
    }
  };

  // Quick Add task handler
  const handleQuickAddSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    if (!activeGroupId) return;

    const trimmedTitle = quickTaskTitle.trim();
    if (!trimmedTitle) return;

    addTodo(activeGroupId, {
      title: trimmedTitle,
      description: quickTaskNote.trim(),
    });

    setQuickTaskTitle("");
    setQuickTaskNote("");
    setIsQuickAddExpanded(false);
    quickInputRef.current?.focus();
  };

  const handleQuickAddKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleQuickAddSubmit();
    }
  };

  // Edit existing todo
  const openEditModal = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditFormValues({
      title: todo.title,
      description: todo.description,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingTodoId(null);
    setEditFormValues({ ...EMPTY_TODO_FORM });
  };

  const handleEditModalSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeGroupId || !editingTodoId) return;

    setIsSavingTodo(true);
    try {
      updateTodo(activeGroupId, editingTodoId, editFormValues);
      closeEditModal();
    } finally {
      setIsSavingTodo(false);
    }
  };

  const handleDeleteSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!pendingDelete) return;

    if (pendingDelete.kind === "group") {
      deleteGroup(pendingDelete.groupId);
      onDeleteGroup(pendingDelete.groupId);
    } else {
      deleteTodo(pendingDelete.groupId, pendingDelete.todoId);
    }

    setPendingDelete(null);
  };

  if (!hasHydrated) {
    return (
      <GlassPanel className="flex h-full min-h-[20rem] items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-sm font-medium text-slate-200">
          <i className="bi bi-arrow-repeat animate-spin text-base" />
          <span>Loading tasks...</span>
        </div>
      </GlassPanel>
    );
  }

  if (!activeGroupId) {
    return (
      <GlassPanel className="flex h-full min-h-[24rem] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-white/20 bg-white/10 text-white/70 shadow-inner">
          <i className="bi bi-check2-circle text-3xl" />
        </div>
        <p className="mt-4 text-xl font-bold text-white">
          Select a list to view tasks
        </p>
        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-300">
          Choose a list from the left sidebar or click{" "}
          <strong className="text-white">New List</strong> to get started.
        </p>
      </GlassPanel>
    );
  }

  if (!activeGroup) {
    return (
      <GlassPanel className="flex h-full min-h-[24rem] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl border border-red-400/30 bg-red-400/10 text-red-200">
          <i className="bi bi-exclamation-triangle text-3xl" />
        </div>
        <p className="mt-4 text-xl font-bold text-white">
          List not found
        </p>
        <p className="mt-2 text-sm text-slate-300">
          This list may have been deleted. Select another list from the sidebar.
        </p>
      </GlassPanel>
    );
  }

  return (
    <>
      <GlassPanel className="flex h-full min-h-0 flex-col overflow-hidden">
        {/* Header: List Name + Counts + Actions */}
        <div className="shrink-0 border-b border-white/15 px-5 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleSaveTitle}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full rounded-xl border border-white/30 bg-slate-900/80 px-3 py-1.5 text-2xl font-bold tracking-tight text-white outline-none focus:border-white/60"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setIsEditingTitle(true)}
                  className="group flex w-full min-w-0 items-center gap-2.5 text-left"
                  title="Click to rename list"
                >
                  <h1 className="block min-w-0 truncate text-2xl font-bold tracking-tight text-white drop-shadow-sm transition group-hover:text-amber-200">
                    {activeGroup.title}
                  </h1>
                  <i className="bi bi-pencil text-sm text-white/50 transition group-hover:text-white" />
                </button>
              )}

              {/* Counts indicator */}
              <div className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
                <span className="text-amber-300">
                  {pendingCount} to do
                </span>
                <span className="text-white/40">•</span>
                <span className="text-emerald-300">
                  {completedCount} completed
                </span>
                {totalCount > 0 && (
                  <span className="hidden sm:inline text-slate-300/80 font-normal">
                    ({totalCount} total)
                  </span>
                )}
              </div>
            </div>

            {/* List Actions */}
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setPendingDelete({
                    kind: "group",
                    groupId: activeGroup.id,
                    label: activeGroup.title,
                  })
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-300/25 bg-red-500/15 text-sm text-red-100 transition hover:bg-red-500/30 hover:text-white shadow-sm"
                title="Delete list"
                aria-label="Delete list"
              >
                <i className="bi bi-trash3" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-sm text-slate-200 transition hover:bg-white/20 hover:text-white md:hidden"
                title="Back to lists"
                aria-label="Back to lists"
              >
                <i className="bi bi-x-lg" />
              </button>
            </div>
          </div>
        </div>

        {/* Microsoft To Do signature "+ Add a task" quick bar */}
        <div className="shrink-0 border-b border-white/15 px-5 py-3 sm:px-6">
          <form
            onSubmit={handleQuickAddSubmit}
            className="flex flex-col rounded-2xl border border-white/20 bg-slate-900/60 p-2.5 transition focus-within:border-white/40 focus-within:bg-slate-900/80 focus-within:shadow-xl focus-within:shadow-black/40"
          >
            <div className="flex items-center gap-3 px-2 py-1">
              <button
                type="submit"
                disabled={!quickTaskTitle.trim()}
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/30 text-white/60 transition hover:border-white/60 hover:text-white disabled:cursor-default disabled:opacity-40"
                title="Add task"
              >
                <i className="bi bi-plus-lg text-sm" />
              </button>

              <input
                ref={quickInputRef}
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onFocus={() => setIsQuickAddExpanded(true)}
                onKeyDown={handleQuickAddKeyDown}
                placeholder="Add a task"
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-white placeholder:text-slate-300/60 outline-none"
              />

              {quickTaskTitle.trim() && (
                <button
                  type="submit"
                  className="rounded-xl border border-white/25 bg-white/25 px-3 py-1 text-xs font-semibold text-white shadow transition hover:bg-white/35 active:scale-95"
                >
                  Add
                </button>
              )}
            </div>

            {/* Expandable note addition */}
            {isQuickAddExpanded && (
              <div className="mt-2 flex flex-col gap-2 border-t border-white/10 px-2 pt-2">
                <textarea
                  rows={2}
                  value={quickTaskNote}
                  onChange={(e) => setQuickTaskNote(e.target.value)}
                  placeholder="Add note or details (optional)..."
                  className="w-full resize-none bg-transparent text-xs leading-5 text-white placeholder:text-slate-400 outline-none"
                />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-300">
                    Press <kbd className="rounded bg-white/15 px-1 py-0.5 font-mono text-[10px] text-white">Enter</kbd> to add
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsQuickAddExpanded(false);
                      setQuickTaskNote("");
                    }}
                    className="text-xs text-slate-300 transition hover:text-white"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Scrollable Tasks Container */}
        <div className="transparent-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-4 sm:px-6">
          {/* Empty state if total is 0 */}
          {totalCount === 0 && (
            <div className="flex h-full min-h-[16rem] flex-col items-center justify-center p-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/5 text-white/50">
                <i className="bi bi-sun text-2xl" />
              </div>
              <p className="mt-3 text-base font-bold text-white">
                No tasks in this list
              </p>
              <p className="mt-1 text-xs text-slate-300">
                Type above in &ldquo;Add a task&rdquo; and press Enter.
              </p>
            </div>
          )}

          {/* Unfinished (Active) Tasks */}
          {unfinishedTodos.length > 0 && (
            <div className="space-y-2">
              {unfinishedTodos.map((todo) => {
                const isStarred = Boolean(todo.isStarred);

                return (
                  <article
                    key={todo.id}
                    className={[
                      "group relative flex items-start gap-3 rounded-2xl border p-3.5 transition-all duration-200 backdrop-blur-md shadow-sm",
                      isStarred
                        ? "border-amber-400/40 bg-amber-500/10 hover:bg-amber-500/15"
                        : "border-white/15 bg-slate-900/50 hover:border-white/25 hover:bg-slate-900/70",
                    ].join(" ")}
                  >
                    {/* Circle Complete Checkbox */}
                    <button
                      type="button"
                      onClick={() =>
                        updateTodo(activeGroup.id, todo.id, {
                          isDone: true,
                        })
                      }
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/5 text-transparent transition duration-200 hover:border-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
                      title="Mark as completed"
                      aria-label="Mark task as completed"
                    >
                      <i className="bi bi-check text-xs font-bold" />
                    </button>

                    {/* Task Title & Details */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-white leading-5">
                        {todo.title}
                      </p>
                      {todo.description ? (
                        <p className="mt-1 text-xs leading-5 text-slate-200 whitespace-pre-wrap break-words">
                          {todo.description}
                        </p>
                      ) : null}
                    </div>

                    {/* Actions: Star Toggle, Edit, Delete */}
                    <div className="flex shrink-0 items-center gap-1">
                      {/* Star Button */}
                      <button
                        type="button"
                        onClick={() => toggleStarTodo(activeGroup.id, todo.id)}
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-lg transition",
                          isStarred
                            ? "text-amber-300 hover:scale-110"
                            : "text-white/40 hover:bg-white/10 hover:text-amber-300",
                        ].join(" ")}
                        title={isStarred ? "Starred / Important" : "Star task"}
                        aria-label={isStarred ? "Unstar task" : "Star task"}
                      >
                        <i
                          className={`bi ${
                            isStarred
                              ? "bi-star-fill text-base drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]"
                              : "bi-star text-sm"
                          }`}
                        />
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(todo)}
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/15 hover:text-white group-hover:flex"
                        title="Edit task"
                        aria-label="Edit task"
                      >
                        <i className="bi bi-pencil" />
                      </button>

                      {/* Delete Button */}
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
                        className="hidden h-8 w-8 items-center justify-center rounded-lg text-slate-300 transition hover:bg-red-500/25 hover:text-red-100 group-hover:flex"
                        title="Delete task"
                        aria-label="Delete task"
                      >
                        <i className="bi bi-trash3" />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Break & Completed Tasks Section */}
          {completedTodos.length > 0 && (
            <div className="space-y-2 pt-2">
              {/* Separator / Collapsible Header */}
              <button
                type="button"
                onClick={() => setShowCompleted(!showCompleted)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-1.5 text-left text-xs font-bold uppercase tracking-wider text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <i
                  className={`bi bi-chevron-${
                    showCompleted ? "down" : "right"
                  } text-xs transition`}
                />
                <span>Completed</span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold text-white">
                  {completedTodos.length}
                </span>
                <div className="h-px flex-1 bg-white/20" />
              </button>

              {/* Completed Tasks List with Line-through */}
              {showCompleted && (
                <div className="space-y-1.5">
                  {completedTodos.map((todo) => {
                    const isStarred = Boolean(todo.isStarred);

                    return (
                      <article
                        key={todo.id}
                        className="group relative flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-3 text-slate-300 transition-all hover:bg-slate-950/60"
                      >
                        {/* Checked Checkbox (Click to uncomplete) */}
                        <button
                          type="button"
                          onClick={() =>
                            updateTodo(activeGroup.id, todo.id, {
                              isDone: false,
                            })
                          }
                          className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-emerald-400/80 bg-emerald-500/80 text-slate-950 transition hover:bg-emerald-400"
                          title="Mark as uncompleted"
                          aria-label="Mark as uncompleted"
                        >
                          <i className="bi bi-check text-xs font-black" />
                        </button>

                        {/* Title with strike-through */}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-slate-400 line-through">
                            {todo.title}
                          </p>
                          {todo.description ? (
                            <p className="mt-0.5 text-xs text-slate-500 line-through whitespace-pre-wrap break-words">
                              {todo.description}
                            </p>
                          ) : null}
                        </div>

                        {/* Actions */}
                        <div className="flex shrink-0 items-center gap-1">
                          {/* Star button */}
                          <button
                            type="button"
                            onClick={() =>
                              toggleStarTodo(activeGroup.id, todo.id)
                            }
                            className={[
                              "flex h-7 w-7 items-center justify-center rounded-lg transition",
                              isStarred
                                ? "text-amber-400"
                                : "text-white/30 hover:text-amber-400",
                            ].join(" ")}
                            title={isStarred ? "Starred" : "Star task"}
                          >
                            <i
                              className={`bi ${
                                isStarred ? "bi-star-fill text-sm" : "bi-star text-xs"
                              }`}
                            />
                          </button>

                          {/* Delete button */}
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
                            className="hidden h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-500/25 hover:text-red-200 group-hover:flex"
                            title="Delete task"
                          >
                            <i className="bi bi-trash3 text-xs" />
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </GlassPanel>

      {/* Edit Todo Modal */}
      <Modal
        open={isEditModalOpen}
        title="Edit task"
        description="Update your task title and details."
        submitLabel="Save Changes"
        loading={isSavingTodo}
        onClose={closeEditModal}
        onSubmit={handleEditModalSubmit}
      >
        <FormField label="Title" htmlFor={editTodoTitleId}>
          <input
            id={editTodoTitleId}
            autoFocus
            value={editFormValues.title}
            onChange={(e) =>
              setEditFormValues((current) => ({
                ...current,
                title: e.target.value,
              }))
            }
            placeholder="Task title"
            className="rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-white/40 focus:bg-slate-900/90"
          />
        </FormField>

        <FormField label="Note / Details" htmlFor={editTodoDescriptionId}>
          <textarea
            id={editTodoDescriptionId}
            rows={4}
            value={editFormValues.description}
            onChange={(e) =>
              setEditFormValues((current) => ({
                ...current,
                description: e.target.value,
              }))
            }
            placeholder="Add any additional notes or details..."
            className="rounded-2xl border border-white/20 bg-slate-900/70 px-4 py-3 text-sm text-white outline-none transition focus:border-white/40 focus:bg-slate-900/90"
          />
        </FormField>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={Boolean(pendingDelete)}
        title={
          pendingDelete?.kind === "group"
            ? "Delete this list?"
            : "Delete this task?"
        }
        description="This action is permanent and cannot be undone."
        submitLabel={
          pendingDelete?.kind === "group" ? "Delete List" : "Delete Task"
        }
        onClose={() => setPendingDelete(null)}
        onSubmit={handleDeleteSubmit}
      >
        <p className="text-sm leading-6 text-slate-200">
          {pendingDelete?.kind === "group"
            ? `Are you sure you want to delete "${pendingDelete.label}" and all of its tasks?`
            : `Are you sure you want to delete "${pendingDelete?.label}"?`}
        </p>
      </Modal>
    </>
  );
}
