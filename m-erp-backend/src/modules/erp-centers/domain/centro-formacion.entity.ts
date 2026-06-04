import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('centro_formacion')
export class CentroFormacion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;
}
