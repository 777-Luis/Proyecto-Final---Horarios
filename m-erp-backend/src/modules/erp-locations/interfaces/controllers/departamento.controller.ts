import { Controller, Post, Body, Get } from '@nestjs/common';
import { CreateDepartamentoAction } from '../../application/actions/create-departamento.action';
import { CreateDepartamentoDto } from '../../application/validators/create-departamento.dto';

@Controller('api/erp/v1/departamentos')
export class DepartamentoController {
  constructor(
    private readonly createDepartamentoAction: CreateDepartamentoAction,
  ) {}

  @Post()
  async create(@Body() dto: CreateDepartamentoDto) {
    return await this.createDepartamentoAction.execute(dto);
  }
}
