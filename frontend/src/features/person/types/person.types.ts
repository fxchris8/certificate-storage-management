export interface Person {
  id: string;
  name: string;
  seamancode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonInput {
  name: string;
  seamancode: string;
}

export interface UpdatePersonInput {
  name?: string;
  seamancode?: string;
}
