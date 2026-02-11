export interface User {
  id: string;
  username: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserInput {
  username: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  password?: string;
}
