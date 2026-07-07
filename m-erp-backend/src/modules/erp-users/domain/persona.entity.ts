import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Municipio } from '../../erp-locations/domain/municipio.entity';

@Entity('personas')
export class Persona {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 150 })
  nombre!: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  apellido!: string;

  @Column({
    type: 'enum',
    enum: ['Aprendiz', 'Instructor', 'Administrador'],
    nullable: true,
  })
  cargo!: string;

  @Column({ type: 'varchar', length: 50 })
  tipo_documento!: string;

  @Column({ type: 'varchar', length: 50, unique: true })
  numero_documento!: string;

  @Column({ type: 'varchar', length: 150 })
  correo!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  direccion!: string;

  @ManyToOne(() => Municipio)
  @JoinColumn({ name: 'municipio_id' })
  municipio!: Municipio;

  @Column({ type: 'varchar', length: 50, nullable: true })
  genero!: string;

  @Column({ type: 'boolean', default: true })
  estado!: boolean;

  @Column({ type: 'uuid', nullable: true })
  sede_id?: string;
}
