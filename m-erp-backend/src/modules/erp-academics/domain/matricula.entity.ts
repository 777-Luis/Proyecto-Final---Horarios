import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Persona } from '../../erp-users/domain/persona.entity';
import { Curso } from './curso.entity';

@Entity('matriculas')
export class Matricula {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Persona)
  @JoinColumn({ name: 'aprendiz_id' })
  aprendiz!: Persona;

  @ManyToOne(() => Curso)
  @JoinColumn({ name: 'curso_id' })
  curso!: Curso;

  @Column({ type: 'varchar', length: 50, default: 'ACTIVA' })
  estado!: string;

  @CreateDateColumn()
  fecha_matricula!: Date;
}
