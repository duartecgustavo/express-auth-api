import { DIUser } from "../../../domain/repositories/IUser";
import { GetUsersDto } from "../../dtos/users/get-users.dto";

export class GetUsersUC {
  constructor(private readonly userRepository: DIUser) {}

  async execute(dto: GetUsersDto) {
    const result = await this.userRepository.findAll({
      page: dto.page,
      limit: dto.limit,
      search: dto.search,
      sortBy: dto.sortBy,
      order: dto.order,
    });

    return result;
  }
}
