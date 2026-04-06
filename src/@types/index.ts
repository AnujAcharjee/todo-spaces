interface BaseTodo {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Todo extends BaseTodo {
  isDone: boolean;
}

export interface AddTodo extends BaseTodo {
  isCompleted: boolean;
}
