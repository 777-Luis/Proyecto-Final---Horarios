import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { HorarioDetalle } from '../horario-detalle.entity';
import { Persona } from '../../../erp-users/domain/persona.entity';
import { Ambiente } from '../../../erp-centers/domain/ambiente.entity';

export enum EstadoRegistroClase {
  PENDIENTE = 'pendiente',
  ACTIVA = 'activa',
  FINALIZADA = 'finalizada',
  SUSPENDIDA = 'suspendida',
  NO_ASISTIO = 'no_asistio',
}

@Entity('registro_clases')
export class RegistroClase {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => HorarioDetalle, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'horario_detalle_id' })
  horario_detalle!: HorarioDetalle | null;

  @Column({ name: 'horario_detalle_id', nullable: true })
  horario_detalle_id!: string | null;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'instructor_id' })
  instructor!: Persona;

  @Column({ name: 'instructor_id' })
  instructor_id!: string;

  @Column({ type: 'date' })
  fecha!: string;

  @Column({ type: 'timestamp', nullable: true })
  hora_activacion!: Date | null;

  @Column({
    type: 'enum',
    enum: EstadoRegistroClase,
    default: EstadoRegistroClase.PENDIENTE,
  })
  estado!: EstadoRegistroClase;

  @Column({ type: 'int', nullable: true })
  minutos_retraso!: number | null;

  @ManyToOne(() => Ambiente, { nullable: true })
  @JoinColumn({ name: 'ambiente_id' })
  ambiente!: Ambiente | null;

  @Column({ name: 'ambiente_id', nullable: true })
  ambiente_id!: string | null;

  @Column({ type: 'boolean', default: false })
  es_transversal!: boolean;

  @Column({ type: 'text', nullable: true })
  motivo_suspension!: string | null;

  @Column({ type: 'boolean', default: false })
  suspension_aprobada!: boolean;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
