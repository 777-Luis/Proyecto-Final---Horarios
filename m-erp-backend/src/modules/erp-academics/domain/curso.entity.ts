import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Area } from '../../erp-centers/domain/area.entity';
import { Programa } from './programa.entity';
import { Ambiente } from '../../erp-centers/domain/ambiente.entity';
import { Persona } from '../../erp-users/domain/persona.entity';

@Entity('cursos')
export class Curso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'int', unique: true })
  id_curso!: number;

  @ManyToOne(() => Area)
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @ManyToOne(() => Programa)
  @JoinColumn({ name: 'programa_id' })
  programa!: Programa;

  @Column({ type: 'date', nullable: true })
  fecha_inicio!: Date;

  @Column({ type: 'date', nullable: true })
  fecha_fin!: Date;

  @Column({
    type: 'enum',
    enum: ['Activo', 'Inactivo'],
    default: 'Activo',
  })
  estado!: string;

  @Column({ type: 'date' })
  inicio_lectiva!: Date;

  @Column({ type: 'date' })
  fin_lectiva!: Date;

  @Column({ type: 'varchar', length: 50 })
  jornada!: string; // Mañana / Tarde

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'ambiente_id' })
  ambiente!: Ambiente;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'lider_id' })
  lider!: Persona;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
