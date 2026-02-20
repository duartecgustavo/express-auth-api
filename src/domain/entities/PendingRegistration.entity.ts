import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class PendingRegistration {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  name: string;

  @Column()
  nickname: string;

  @Column({ type: "varchar", nullable: true })
  linkedin: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  expiresAt: Date;
}
