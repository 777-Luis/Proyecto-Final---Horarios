import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CentroFormacion } from './centro-formacion.entity';

@Entity('sedes')
export class Sede {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @ManyToOne(() => CentroFormacion)
  @JoinColumn({ name: 'centro_formacion_id' })
  centro_formacion!: CentroFormacion;
}
