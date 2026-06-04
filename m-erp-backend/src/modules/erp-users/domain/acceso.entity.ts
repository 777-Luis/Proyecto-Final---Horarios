import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './usuario.entity';
import { Aplicativo } from './aplicativo.entity';

@Entity('accesos')
export class Acceso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @ManyToOne(() => Aplicativo)
  @JoinColumn({ name: 'aplicativo_id' })
  aplicativo!: Aplicativo;

  @CreateDateColumn()
  fecha_hora!: Date;

  @Column({ type: 'varchar', length: 45 }) // IPv6 max length is 45
  ip!: string;
}
