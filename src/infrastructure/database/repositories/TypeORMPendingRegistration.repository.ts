import { Repository } from "typeorm";
import { PendingRegistration } from "../../../domain/entities/PendingRegistration.entity";
import { IPendingRegistrationRepository } from "../../../domain/repositories/IPendingRegistration";
import { AppDataSource } from "../data-source";

export class TypeORMPendingRegistrationRepository
  implements IPendingRegistrationRepository
{
  private repository: Repository<PendingRegistration>;

  constructor() {
    this.repository = AppDataSource.getRepository(PendingRegistration);
  }

  async findByEmail(email: string): Promise<PendingRegistration | null> {
    return this.repository.findOne({
      where: { email: email.toLowerCase() },
    });
  }

  async save(pending: PendingRegistration): Promise<PendingRegistration> {
    return this.repository.save(pending);
  }

  async deleteByEmail(email: string): Promise<void> {
    await this.repository.delete({ email: email.toLowerCase() });
  }
}
