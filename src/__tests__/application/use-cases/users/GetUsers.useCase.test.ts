import { GetUsersDto } from "../../../../application/dtos/users/get-users.dto";
import { GetUsersUC } from "../../../../application/use-cases/users/GetUsers.useCase";
import { User } from "../../../../domain/entities/User.entity";
import { DIUser } from "../../../../domain/repositories/IUser";

describe("GetUsersUseCase class", () => {
  let getUsersUC: GetUsersUC;
  let mockUserRepository: jest.Mocked<DIUser>;

  beforeEach(() => {
    mockUserRepository = {
      findById: jest.fn(),
      findByEmail: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
      findAll: jest.fn(),
    } as jest.Mocked<DIUser>;

    getUsersUC = new GetUsersUC(mockUserRepository);
  });

  describe("when the list of users is successfull retrieved", () => {
    it("must return the list of users with pagination", async () => {
      const dto: GetUsersDto = {
        page: 1,
        limit: 10,
      };

      const mockUsers: User[] = [
        {
          id: 1,
          email: "usuario1@exemplo.com",
          password: "hashed1",
          name: "Usuário 1",
          isConfirmed: true,
          createdAt: new Date(),
        },
        {
          id: 2,
          email: "usuario2@exemplo.com",
          password: "hashed2",
          name: "Usuário 2",
          isConfirmed: false,
          createdAt: new Date(),
        },
      ];

      const mockResult = {
        users: mockUsers,
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
      };

      mockUserRepository.findAll.mockResolvedValue(mockResult);

      const result = await getUsersUC.execute(dto);

      expect(result).toEqual(mockResult);
      expect(result.users).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
      expect(result.total).toBe(2);
    });
  });
  it("must pass the pagination parameters correctly to the repository", async () => {
    const dto: GetUsersDto = {
      page: 2,
      limit: 20,
    };

    mockUserRepository.findAll.mockResolvedValue({
      users: [],
      page: 2,
      limit: 20,
      total: 0,
      totalPages: 0,
    });

    await getUsersUC.execute(dto);

    expect(mockUserRepository.findAll).toHaveBeenCalledWith({
      page: 2,
      limit: 20,
      search: undefined,
      sortBy: undefined,
      order: undefined,
    });
  });
  it("must pass the search parameters to the repository", async () => {
    const dto: GetUsersDto = {
      page: 1,
      limit: 10,
      search: "joão",
    };

    mockUserRepository.findAll.mockResolvedValue({
      users: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

    await getUsersUC.execute(dto);

    expect(mockUserRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: "joão",
      sortBy: undefined,
      order: undefined,
    });
  });
  it("must pass the sorting parameters to the repository", async () => {
    const dto: GetUsersDto = {
      page: 1,
      limit: 10,
      sortBy: "createdAt",
      order: "desc",
    };

    mockUserRepository.findAll.mockResolvedValue({
      users: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    });

    await getUsersUC.execute(dto);

    expect(mockUserRepository.findAll).toHaveBeenCalledWith({
      page: 1,
      limit: 10,
      search: undefined,
      sortBy: "createdAt",
      order: "desc",
    });
  });
  it("must pass all provided parameters", async () => {
    const dto: GetUsersDto = {
      page: 3,
      limit: 5,
      search: "maria",
      sortBy: "name",
      order: "asc",
    };

    mockUserRepository.findAll.mockResolvedValue({
      users: [],
      page: 3,
      limit: 5,
      total: 0,
      totalPages: 0,
    });

    await getUsersUC.execute(dto);

    expect(mockUserRepository.findAll).toHaveBeenCalledWith({
      page: 3,
      limit: 5,
      search: "maria",
      sortBy: "name",
      order: "asc",
    });
  });
  it("must return an empty list when no users are registered", async () => {
    const dto: GetUsersDto = {
      page: 1,
      limit: 10,
    };

    const mockEmptyResult = {
      users: [],
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    };

    mockUserRepository.findAll.mockResolvedValue(mockEmptyResult);

    const result = await getUsersUC.execute(dto);

    expect(result.users).toEqual([]);
    expect(result.users).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
