import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from '../../erp-centers/domain/area.entity';

@Entity('programas')
export class Programa {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({
    type: 'enum',
    enum: ['Tecnólogo', 'Técnico', 'Curso'],
    nullable: true,
  })
  tipo_programa!: string;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
