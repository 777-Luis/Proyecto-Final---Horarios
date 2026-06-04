import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Horario } from './horario.entity';
import { Persona } from '../../erp-users/domain/persona.entity';

@Entity('horario_detalle')
export class HorarioDetalle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Horario, (horario) => horario.detalles)
  @JoinColumn({ name: 'horario_id' })
  horario!: Horario;

  @Column({ type: 'int' })
  dia!: number; // 0 = Domingo, 1 = Lunes... o String según preferencia, usaremos int.

  @Column({ type: 'time' })
  hora_inicio!: string;

  @Column({ type: 'time' })
  hora_fin!: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'instructor_id' })
  instructor!: Persona;

  @Column({ type: 'boolean', default: false })
  es_transversal!: boolean;

  @Column({ type: 'text', nullable: true })
  competencia?: string;

  @Column({ type: 'text', nullable: true })
  resultado?: string;

  @Column({ type: 'date', nullable: true })
  fecha_inicio_competencia?: string;

  @Column({ type: 'date', nullable: true })
  fecha_fin_competencia?: string;
}
