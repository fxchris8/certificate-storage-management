export interface RegisterInputTypes {
  username: string;
  password: string;
  password2: string;
}

export interface LoginInputTypes {
  username: string;
  password: string;
}

export interface UpdateUserInputTypes {
  username?: string;
  password?: string;
}
