import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../erp-users/domain/usuario.entity';
import { SolicitudCambio } from './solicitud-cambio.entity';

@Entity('notificaciones')
export class Notificacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @Column({ type: 'text' })
  mensaje!: string;

  @Column({ type: 'boolean', default: false })
  leida!: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  fecha!: Date;

  @ManyToOne(() => SolicitudCambio, { nullable: true })
  @JoinColumn({ name: 'referencia_solicitud_id' })
  referencia_solicitud!: SolicitudCambio;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
