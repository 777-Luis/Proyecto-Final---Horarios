import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('credenciales')
export class Credencial {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'timestamp', nullable: true })
  ultimo_acceso!: Date;
}
