import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('aplicativos')
export class Aplicativo {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  nombre!: string;

  @Column({ type: 'text', nullable: true })
  descripcion!: string;
}
