import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  Seller = 'seller',
  Buyer = 'buyer',
}

export enum UserStatus {
  Active = 'active',
  Inactive = 'inactive',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  password!: string;

  @Column({ type: 'varchar' })
  firstName!: string;

  @Column({ type: 'varchar' })
  lastName!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.Active })
  status!: UserStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
