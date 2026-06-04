import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Sede } from './sede.entity';
import { Persona } from '../../erp-users/domain/persona.entity';

@Entity('areas')
export class Area {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @ManyToOne(() => Sede)
  @JoinColumn({ name: 'sede_id' })
  sede!: Sede;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'lider_id' })
  lider!: Persona;
}
