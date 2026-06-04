import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Departamento } from './departamento.entity';

@Entity('municipios')
export class Municipio {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @ManyToOne(() => Departamento, (departamento) => departamento.municipios)
  @JoinColumn({ name: 'departamento_id' })
  departamento!: Departamento;
}
