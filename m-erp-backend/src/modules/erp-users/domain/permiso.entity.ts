import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Usuario } from './usuario.entity';
import { Aplicativo } from './aplicativo.entity';

@Entity('permisos')
export class Permiso {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'usuario_id' })
  usuario!: Usuario;

  @ManyToOne(() => Aplicativo)
  @JoinColumn({ name: 'aplicativo_id' })
  aplicativo!: Aplicativo;
}
