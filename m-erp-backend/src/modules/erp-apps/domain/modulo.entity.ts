import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Aplicativo } from '../../erp-users/domain/aplicativo.entity';

@Entity('modulos')
export class Modulo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @ManyToOne(() => Aplicativo)
  @JoinColumn({ name: 'aplicativo_id' })
  aplicativo!: Aplicativo;
}
