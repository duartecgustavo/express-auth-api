import { PendingRegistration } from "../entities/PendingRegistration.entity";

export interface IPendingRegistrationRepository {
  findByEmail(email: string): Promise<PendingRegistration | null>;
  save(pending: PendingRegistration): Promise<PendingRegistration>;
  deleteByEmail(email: string): Promise<void>;
}
