import { User } from "../entities/User";

export interface DIUser {
  findByEmail(email: string): Promise<User | null>;
  findById(id: number): Promise<User | null>;
  save(user: User): Promise<User>;
  delete(id: number): Promise<void>;
  findAll(): Promise<User[]>;
}
