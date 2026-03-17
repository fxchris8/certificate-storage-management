export interface Person {
  id: string;
  name: string;
  seafarercode: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePersonInput {
  name: string;
  seafarercode: string;
}

export interface UpdatePersonInput {
  name?: string;
  seafarercode?: string;
}
