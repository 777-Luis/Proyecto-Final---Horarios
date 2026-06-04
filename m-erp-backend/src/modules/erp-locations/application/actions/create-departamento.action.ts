import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from '../../domain/departamento.entity';
import { CreateDepartamentoDto } from '../validators/create-departamento.dto';

@Injectable()
export class CreateDepartamentoAction {
  constructor(
    @InjectRepository(Departamento)
    private readonly departamentoRepository: Repository<Departamento>,
  ) {}

  async execute(dto: CreateDepartamentoDto): Promise<Departamento> {
    const departamento = this.departamentoRepository.create(dto);
    return await this.departamentoRepository.save(departamento);
  }
}
