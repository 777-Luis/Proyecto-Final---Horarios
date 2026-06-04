import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Modulo } from './modulo.entity';

@Entity('servicios')
export class Servicio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;

  @ManyToOne(() => Modulo)
  @JoinColumn({ name: 'modulo_id' })
  modulo!: Modulo;
}
