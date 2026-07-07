import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Curso } from '../../erp-academics/domain/curso.entity';
import { Ambiente } from '../../erp-centers/domain/ambiente.entity';
import { HorarioDetalle } from './horario-detalle.entity';

@Entity('horarios')
export class Horario {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Curso)
  @JoinColumn({ name: 'curso_id' })
  curso!: Curso;

  @ManyToOne(() => Ambiente)
  @JoinColumn({ name: 'ambiente_id' })
  ambiente!: Ambiente;

  @Column({ type: 'varchar', length: 50 })
  jornada!: string;

  @OneToMany(() => HorarioDetalle, (detalle: HorarioDetalle) => detalle.horario)
  detalles!: HorarioDetalle[];

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
