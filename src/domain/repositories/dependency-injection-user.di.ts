import { User } from "../entities/User";

export interface IFindUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: "name" | "email" | "createdAt";
  order?: "asc" | "desc";
}

export interface IPaginatedUsers {
  users: Omit<User, "password">[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface DIUser {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  findAll(options?: IFindUsersOptions): Promise<IPaginatedUsers>;
}
