import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { GroupFormValues, Todo, TodoFormValues, TodoGroup } from "@/@types";
import { idbStorage } from "@/store/idb";

const STORE_VERSION = 2;

type TodoGroups = Record<string, TodoGroup>;

interface PersistedTodosState {
  groups: TodoGroups;
  groupOrder: string[];
  hasHydrated: boolean;
}

interface TodosActions {
  addGroup: (values: GroupFormValues) => string | null;
  updateGroup: (groupId: string, values: Partial<GroupFormValues>) => void;
  deleteGroup: (groupId: string) => void;
  addTodo: (groupId: string, values: TodoFormValues) => string | null;
  deleteTodo: (groupId: string, todoId: string) => void;
  updateTodo: (groupId: string, todoId: string, values: Partial<Todo>) => void;
  setHasHydrated: (state: boolean) => void;
}

type TodosStore = PersistedTodosState & TodosActions;

interface LegacyTodo {
  id: string;
  title?: string;
  description: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  isDone?: boolean;
  isCompleted?: boolean;
}

interface LegacyTodoGroup {
  name?: string;
  todos?: Record<string, LegacyTodo>;
}

interface LegacyPersistedState {
  groups?: Record<string, LegacyTodoGroup>;
  hasHydrated?: boolean;
}

function createId() {
  return crypto.randomUUID();
}

function createTimestamp() {
  return new Date().toISOString();
}

function normalizeText(value: string) {
  return value.trim();
}

function buildFallbackTodoTitle(description: string) {
  const cleanDescription = normalizeText(description);

  if (!cleanDescription) {
    return "Untitled todo";
  }

  return cleanDescription.length > 40
    ? `${cleanDescription.slice(0, 37)}...`
    : cleanDescription;
}

function normalizeDate(value: string | Date | undefined) {
  if (!value) {
    return createTimestamp();
  }

  const dateValue = value instanceof Date ? value.toISOString() : value;
  return Number.isNaN(Date.parse(dateValue)) ? createTimestamp() : dateValue;
}

function createEmptyState(): PersistedTodosState {
  return {
    groups: {},
    groupOrder: [],
    hasHydrated: false,
  };
}

function migratePersistedState(state: unknown): PersistedTodosState {
  if (!state || typeof state !== "object") {
    return createEmptyState();
  }

  const candidate = state as Partial<PersistedTodosState & LegacyPersistedState>;

  if (candidate.groups && Array.isArray(candidate.groupOrder)) {
    const nextGroups: TodoGroups = {};
    const nextOrder: string[] = [];

    for (const groupId of candidate.groupOrder) {
      const group = candidate.groups[groupId];

      if (!group) {
        continue;
      }

      nextGroups[groupId] = {
        ...group,
        todos: group.todos ?? {},
      };
      nextOrder.push(groupId);
    }

    for (const [groupId, group] of Object.entries(candidate.groups)) {
      if (nextGroups[groupId]) {
        continue;
      }

      nextGroups[groupId] = {
        ...group,
        todos: group.todos ?? {},
      };
      nextOrder.push(groupId);
    }

    return {
      groups: nextGroups,
      groupOrder: nextOrder,
      hasHydrated: false,
    };
  }

  const legacyGroups = candidate.groups ?? {};
  const nextGroups: TodoGroups = {};
  const nextOrder: string[] = [];

  for (const [groupName, group] of Object.entries(legacyGroups)) {
    const groupId = createId();
    const now = createTimestamp();
    const todos = Object.fromEntries(
      Object.entries(group.todos ?? {}).map(([todoId, todo]) => {
        const title = normalizeText(todo.title ?? "");
        const description = normalizeText(todo.description ?? "");

        return [
          todoId,
          {
            id: todo.id ?? todoId,
            title: title || buildFallbackTodoTitle(description),
            description,
            isDone: todo.isDone ?? todo.isCompleted ?? false,
            createdAt: normalizeDate(todo.createdAt),
            updatedAt: normalizeDate(todo.updatedAt),
          } satisfies Todo,
        ];
      }),
    );

    nextGroups[groupId] = {
      id: groupId,
      title: normalizeText(group.name ?? groupName) || "Untitled group",
      description: "",
      createdAt: now,
      updatedAt: now,
      todos,
    };
    nextOrder.push(groupId);
  }

  return {
    groups: nextGroups,
    groupOrder: nextOrder,
    hasHydrated: false,
  };
}

export const useTodosStore = create<TodosStore>()(
  persist(
    (set) => ({
      ...createEmptyState(),

      addGroup: (values) => {
        const title = normalizeText(values.title);
        const description = normalizeText(values.description);

        if (!title) {
          return null;
        }

        const groupId = createId();
        const timestamp = createTimestamp();

        set((state) => ({
          groups: {
            ...state.groups,
            [groupId]: {
              id: groupId,
              title,
              description,
              createdAt: timestamp,
              updatedAt: timestamp,
              todos: {},
            },
          },
          groupOrder: [...state.groupOrder, groupId],
        }));

        return groupId;
      },

      updateGroup: (groupId, values) =>
        set((state) => {
          const group = state.groups[groupId];

          if (!group) {
            return state;
          }

          const timestamp = createTimestamp();

          const nextTitle =
            values.title === undefined ? group.title : normalizeText(values.title);
          const nextDescription =
            values.description === undefined
              ? group.description
              : normalizeText(values.description);

          if (!nextTitle) {
            return state;
          }

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                title: nextTitle,
                description: nextDescription,
                updatedAt: timestamp,
              },
            },
          };
        }),

      deleteGroup: (groupId) =>
        set((state) => {
          if (!state.groups[groupId]) {
            return state;
          }

          const nextGroups = { ...state.groups };
          delete nextGroups[groupId];

          return {
            groups: nextGroups,
            groupOrder: state.groupOrder.filter((id) => id !== groupId),
          };
        }),

      addTodo: (groupId, values) => {
        const title = normalizeText(values.title);
        const description = normalizeText(values.description);

        if (!title) {
          return null;
        }

        const todoId = createId();
        const timestamp = createTimestamp();

        set((state) => {
          const group = state.groups[groupId];

          if (!group) {
            return state;
          }

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                updatedAt: timestamp,
                todos: {
                  ...group.todos,
                  [todoId]: {
                    id: todoId,
                    title,
                    description,
                    isDone: false,
                    createdAt: timestamp,
                    updatedAt: timestamp,
                  },
                },
              },
            },
          };
        });

        return todoId;
      },

      deleteTodo: (groupId, todoId) =>
        set((state) => {
          const group = state.groups[groupId];

          if (!group || !group.todos[todoId]) {
            return state;
          }

          const timestamp = createTimestamp();

          const nextTodos = { ...group.todos };
          delete nextTodos[todoId];

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                updatedAt: timestamp,
                todos: nextTodos,
              },
            },
          };
        }),

      updateTodo: (groupId, todoId, values) =>
        set((state) => {
          const group = state.groups[groupId];
          const todo = group?.todos[todoId];

          if (!group || !todo) {
            return state;
          }

          const timestamp = createTimestamp();

          const nextTitle =
            values.title === undefined ? todo.title : normalizeText(values.title);
          const nextDescription =
            values.description === undefined
              ? todo.description
              : normalizeText(values.description);

          return {
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                updatedAt: timestamp,
                todos: {
                  ...group.todos,
                  [todoId]: {
                    ...todo,
                    ...values,
                    title: nextTitle || todo.title,
                    description: nextDescription,
                    updatedAt: timestamp,
                  },
                },
              },
            },
          };
        }),

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "todos-idb",
      version: STORE_VERSION,
      storage: createJSONStorage(() => idbStorage),
      migrate: (persistedState) => migratePersistedState(persistedState),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
