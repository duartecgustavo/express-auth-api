import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;
  
  @Column()
  name: string;

  @Column({ default: false })
  isConfirmed: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
