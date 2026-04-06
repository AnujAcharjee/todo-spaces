export interface Todo {
  id: string;
  title: string;
  description: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TodoGroup {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  todos: Record<string, Todo>;
}

export interface GroupFormValues {
  title: string;
  description: string;
}

export interface TodoFormValues {
  title: string;
  description: string;
}
