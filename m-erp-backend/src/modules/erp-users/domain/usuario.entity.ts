import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from './persona.entity';
import { Credencial } from './credencial.entity';
import { Rol } from './rol.entity';
import { Area } from '../../erp-centers/domain/area.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Persona)
  @JoinColumn({ name: 'persona_id' })
  persona!: Persona;

  @OneToOne(() => Credencial)
  @JoinColumn({ name: 'credencial_id' })
  credencial!: Credencial;

  @ManyToOne(() => Rol) // Assuming un usuario tiene un rol principal (no estaba explícito en el spec de tablas, pero es común. Si no, podemos obviarlo, pero es útil para RLS si depende de "su rol").
  @JoinColumn({ name: 'rol_id' })
  rol!: Rol;

  @ManyToOne(() => Area, { nullable: true })
  @JoinColumn({ name: 'area_id' })
  area!: Area;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @CreateDateColumn()
  fecha_creacion!: Date;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
