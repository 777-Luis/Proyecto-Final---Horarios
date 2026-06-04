import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, UseInterceptors, UploadedFile, Res, Req, ForbiddenException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { UsersService } from '../../application/users.service';
import { ExcelUploadService } from '../../application/excel-upload.service';
import { CreateUserDto } from './dtos/create-user.dto';
import { FilterUsersDto } from './dtos/filter-users.dto';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly excelUploadService: ExcelUploadService,
  ) {}

  @Roles('Administrador', 'Instructor')
  @Get()
  async findAll(@Query() filterDto: FilterUsersDto) {
    return this.usersService.findAllPaginated(filterDto);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Get(':id')
  async findOneIndividual(@Param('id') id: string, @Req() req: any) {
    const targetId = id === 'me' ? req.user.userId : id;
    if (req.user.role !== 'Administrador' && req.user.userId !== targetId) {
      throw new ForbiddenException('No tienes permiso para ver este perfil');
    }
    return this.usersService.findOneIndividual(targetId);
  }

  @Roles('Administrador')
  @Post()
  async createIndividual(@Body() dto: CreateUserDto) {
    return this.usersService.createIndividual(dto);
  }

  @Roles('Administrador')
  @Patch(':id/status')
  async toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @Roles('Administrador', 'Instructor', 'Aprendiz')
  @Patch(':id')
  async updateIndividual(@Param('id') id: string, @Body() dto: any, @Req() req: any) {
    const targetId = id === 'me' ? req.user.userId : id;
    if (req.user.role !== 'Administrador' && req.user.userId !== targetId) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil');
    }
    return this.usersService.updateIndividual(targetId, dto);
  }

  @Roles('Administrador')
  @Delete(':id')
  async deleteIndividual(@Param('id') id: string) {
    return this.usersService.deleteIndividual(id);
  }

  @Roles('Administrador')
  @Post('mass-upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadExcel(@UploadedFile() file: any) {
    if (!file) throw new Error('Archivo excel no adjuntado');
    return this.excelUploadService.processUpload(file.buffer);
  }
}
