import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Municipio } from './municipio.entity';

@Entity('departamentos')
export class Departamento {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @OneToMany(() => Municipio, (municipio) => municipio.departamento)
  municipios!: Municipio[];
}
