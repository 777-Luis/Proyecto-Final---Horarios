import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from '../../erp-users/domain/persona.entity';

@Entity('solicitudes_cambio')
export class SolicitudCambio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'instructor_id' })
  instructor!: Persona;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'lider_area_id' })
  lider_area!: Persona;

  @Column({ type: 'varchar', length: 150 })
  tipo_solicitud!: string;

  @Column({ type: 'text' })
  descripcion!: string;

  @Column({ type: 'jsonb', nullable: true })
  detalles_propuestos?: Record<string, any>;

  @Column({ type: 'varchar', length: 50, default: 'PENDIENTE' })
  estado!: string;

  @Column({ type: 'text', nullable: true })
  observaciones_admin!: string;

  @CreateDateColumn()
  fecha_solicitud!: Date;

  @Column({ type: 'timestamp', nullable: true })
  fecha_envio_admin!: Date; // Aprobado/Rechazado y enviado hacia admin superior si aplica

  @Column({ type: 'timestamp', nullable: true })
  fecha_respuesta_admin!: Date;
}
