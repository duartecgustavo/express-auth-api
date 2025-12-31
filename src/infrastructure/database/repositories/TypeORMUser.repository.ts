import { Repository } from "typeorm";
import { User } from "../../../domain/entities/User.entity";
import {
  DIUser,
  IFindUsersOptions,
  IPaginatedUsers,
} from "../../../domain/repositories/IUser";
import { AppDataSource } from "../data-source";

export class TypeORMUserRepository implements DIUser {
  private repository: Repository<User>;

  constructor() {
    this.repository = AppDataSource.getRepository(User);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async findById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }

  async delete(id: number): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(options?: IFindUsersOptions): Promise<IPaginatedUsers> {
    const {
      page = 1,
      limit = 10,
      search,
      sortBy = "createdAt",
      order = "desc",
    } = options || {};

    const skip = (page - 1) * limit;

    const whereCondition = search ? [{ name: search }, { email: search }] : {};

    const [users, total] = await this.repository.findAndCount({
      where: whereCondition,
      order: { [sortBy]: order.toUpperCase() },
      skip,
      take: limit,
      select: ["id", "email", "name", "isConfirmed", "createdAt"],
    });

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
