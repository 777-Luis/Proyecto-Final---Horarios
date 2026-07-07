import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from './area.entity';

@Entity('ambientes')
export class Ambiente {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @Column({ type: 'int', default: 0 })
  capacidad!: number;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
