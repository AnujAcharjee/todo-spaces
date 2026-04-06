import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Todo } from "@/@types";
import { idbStorage } from "@/store/idb";

interface TodoGroup {
  name: string;
  todos: Record<string, Todo>;
}

interface TodosState {
  groups: Record<string, TodoGroup>;
  hasHydrated: boolean;
}

interface TodosActions {
  addGroup: (groupName: string) => void;
  deleteGroup: (groupName: string) => void;
  addTodo: (groupName: string, todo: Todo) => void;
  deleteTodo: (groupName: string, id: string) => void;
  updateTodo: (groupName: string, id: string, updated: Partial<Todo>) => void;
  setHasHydrated: (state: boolean) => void;
}

type TodosStore = TodosState & TodosActions;

export const useTodosStore = create<TodosStore>()(
  persist<TodosStore>(
    (set) => ({
      groups: {},
      hasHydrated: false,

      addGroup: (groupName: string) =>
        set((state) => {
          if (state.groups[groupName]) return state;
          return {
            groups: {
              ...state.groups,
              [groupName]: {
                name: groupName,
                todos: {},
              },
            },
          };
        }),

      deleteGroup: (groupName: string) =>
        set((state) => {
          const newGroups = { ...state.groups };
          delete newGroups[groupName];
          return { groups: newGroups };
        }),

      addTodo: (groupName: string, todo: Todo) =>
        set((state) => ({
          groups: {
            ...state.groups,
            [groupName]: {
              name: state.groups[groupName]?.name ?? groupName,
              todos: {
                ...state.groups[groupName]?.todos,
                [todo.id]: todo,
              },
            },
          },
        })),

      deleteTodo: (groupName: string, id: string) =>
        set((state) => {
          const group = state.groups[groupName];
          if (!group) return state;

          const newTodos = { ...group.todos };
          delete newTodos[id];

          return {
            groups: {
              ...state.groups,
              [groupName]: {
                ...group,
                todos: newTodos,
              },
            },
          };
        }),

      updateTodo: (groupName: string, id: string, updated: Partial<Todo>) =>
        set((state) => {
          const group = state.groups[groupName];
          if (!group) return state;

          return {
            groups: {
              ...state.groups,
              [groupName]: {
                ...group,
                todos: {
                  ...group.todos,
                  [id]: {
                    ...group.todos[id],
                    ...updated,
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
      storage: createJSONStorage(() => idbStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
