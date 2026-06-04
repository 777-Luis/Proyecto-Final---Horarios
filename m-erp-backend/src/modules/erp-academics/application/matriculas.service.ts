import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Matricula } from '../domain/matricula.entity';
import { Curso } from '../domain/curso.entity';
import { Persona } from '../../erp-users/domain/persona.entity';
import { Usuario } from '../../erp-users/domain/usuario.entity';

@Injectable()
export class MatriculasService {
  constructor(
    @InjectRepository(Matricula) private matriculaRepo: Repository<Matricula>,
    @InjectRepository(Curso) private cursoRepo: Repository<Curso>,
    @InjectRepository(Persona) private personaRepo: Repository<Persona>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
  ) {}

  async createMatricula(usuario_id: string, curso_id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuario_id },
      relations: ['persona']
    });

    if (!usuario || !usuario.persona) {
      throw new NotFoundException('Usuario o Persona no encontrada');
    }

    const curso = await this.cursoRepo.findOne({ where: { id: curso_id } });
    if (!curso) {
      throw new NotFoundException('Curso no encontrado');
    }

    // Check if user already has an active matricula
    const existing = await this.matriculaRepo.findOne({
      where: { aprendiz: { id: usuario.persona.id }, estado: 'ACTIVA' },
      relations: ['aprendiz']
    });

    if (existing) {
      // Upsert it
      existing.curso = curso;
      await this.matriculaRepo.save(existing);
      return { message: 'Matrícula actualizada exitosamente', id: existing.id };
    }

    const matricula = this.matriculaRepo.create({
      aprendiz: usuario.persona,
      curso: curso,
      estado: 'ACTIVA'
    });

    await this.matriculaRepo.save(matricula);
    return { message: 'Matrícula creada exitosamente', id: matricula.id };
  }

  async getMatriculaByUsuario(usuario_id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: usuario_id },
      relations: ['persona']
    });

    if (!usuario || !usuario.persona) {
      throw new NotFoundException('Usuario o Persona no encontrada');
    }

    const matricula = await this.matriculaRepo.findOne({
      where: { aprendiz: { id: usuario.persona.id }, estado: 'ACTIVA' },
      relations: ['curso']
    });

    if (!matricula) {
      return null;
    }

    return matricula;
  }
}
