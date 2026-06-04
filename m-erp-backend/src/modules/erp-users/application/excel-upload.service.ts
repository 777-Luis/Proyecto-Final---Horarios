import { Injectable, BadRequestException } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UsersService } from './users.service';
import { Curso } from '../../erp-academics/domain/curso.entity';
import { Municipio } from '../../erp-locations/domain/municipio.entity';
import { Persona } from '../domain/persona.entity';
import { Credencial } from '../domain/credencial.entity';
import { Usuario } from '../domain/usuario.entity';
import { Rol } from '../domain/rol.entity';
import { Matricula } from '../../erp-academics/domain/matricula.entity';

@Injectable()
export class ExcelUploadService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(Curso) private cursoRepo: Repository<Curso>,
    @InjectRepository(Municipio) private municipioRepo: Repository<Municipio>,
    @InjectRepository(Persona) private personaRepo: Repository<Persona>,
    @InjectRepository(Credencial) private credencialRepo: Repository<Credencial>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Rol) private rolRepo: Repository<Rol>,
    @InjectRepository(Matricula) private matriculaRepo: Repository<Matricula>,
  ) {}

  async processUpload(buffer: any) {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const sheet = workbook.getWorksheet(1);
    
    if (!sheet) throw new BadRequestException('El archivo Excel no tiene hojas válidas.');

    const result = {
      total: 0,
      exitosos: 0,
      fallidos: 0,
      detalles: [] as any[]
    };

    const rowCount = sheet.rowCount;
    if (rowCount < 2) return result;

    const rows = sheet.getRows(2, rowCount - 1) || [];

    for (const row of rows) {
      if (!row.values || !(row.values as any[]).length) continue;
      
      result.total++;
      
      const dtoObj = {
        nombre_completo: row.getCell(1).value?.toString() || '',
        tipo_documento: row.getCell(2).value?.toString() || '',
        numero_documento: row.getCell(3).value?.toString() || '',
        correo_electronico: row.getCell(4).value?.toString() || '',
        contrasena: row.getCell(5).value?.toString() || '',
        direccion: row.getCell(6).value?.toString() || '',
        municipio: row.getCell(7).value?.toString() || '',
        genero: row.getCell(8).value?.toString() || '',
        ficha_curso: row.getCell(9).value?.toString() || '',
      };

      // Validar campos obligatorios vacíos
      if (!dtoObj.nombre_completo || !dtoObj.tipo_documento || !dtoObj.numero_documento || 
          !dtoObj.correo_electronico || !dtoObj.contrasena || !dtoObj.municipio || !dtoObj.ficha_curso) {
        result.fallidos++;
        result.detalles.push({ fila: row.number, error: 'Campos obligatorios vacíos' });
        continue;
      }

      // Validar curso
      const fichaNum = parseInt(dtoObj.ficha_curso, 10);
      const curso = await this.cursoRepo.findOne({ where: { id_curso: fichaNum } });
      if (!curso) {
        result.fallidos++;
        result.detalles.push({ 
          fila: row.number, 
          error: `La ficha ${dtoObj.ficha_curso} no existe en el sistema. El curso debe estar creado previamente antes de matricular aprendices.` 
        });
        continue;
      }

      // Validar municipio
      const municipio = await this.municipioRepo.findOne({ where: { nombre: dtoObj.municipio } });
      if (!municipio) {
        result.fallidos++;
        result.detalles.push({ fila: row.number, error: `Municipio no encontrado en el sistema: ${dtoObj.municipio}` });
        continue;
      }

      // Validar duplicados
      const existePersona = await this.personaRepo.findOne({ where: { numero_documento: dtoObj.numero_documento } });
      if (existePersona) {
        result.fallidos++;
        result.detalles.push({ fila: row.number, error: `Documento duplicado en el sistema: ${dtoObj.numero_documento}` });
        continue;
      }

      const existePersonaCorreo = await this.personaRepo.findOne({ where: { correo: dtoObj.correo_electronico } });
      const existeCredencial = await this.credencialRepo.findOne({ where: { username: dtoObj.correo_electronico } });
      if (existePersonaCorreo || existeCredencial) {
        result.fallidos++;
        result.detalles.push({ fila: row.number, error: `Correo duplicado en el sistema: ${dtoObj.correo_electronico}` });
        continue;
      }

      // Roll Aprendiz
      let rolAprendiz = await this.rolRepo.findOne({ where: { nombre: 'Aprendiz' } });
      if (!rolAprendiz) {
        rolAprendiz = this.rolRepo.create({ nombre: 'Aprendiz', descripcion: 'Rol para aprendices' });
        await this.rolRepo.save(rolAprendiz);
      }

      try {
        // 1. Crear persona
        const persona = this.personaRepo.create({
          nombre: dtoObj.nombre_completo,
          tipo_documento: dtoObj.tipo_documento,
          numero_documento: dtoObj.numero_documento,
          correo: dtoObj.correo_electronico,
          direccion: dtoObj.direccion,
          genero: dtoObj.genero,
          municipio: municipio
        });
        await this.personaRepo.save(persona);

        // 2. Crear credenciales
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(dtoObj.contrasena, salt);
        const credencial = this.credencialRepo.create({
          username: dtoObj.correo_electronico,
          password_hash: hashedPassword
        });
        await this.credencialRepo.save(credencial);

        // 3. Crear usuario
        const usuario = this.usuarioRepo.create({
          persona: persona,
          credencial: credencial,
          rol: rolAprendiz,
          estado: true
        });
        await this.usuarioRepo.save(usuario);

        // 4. Crear matricula
        const matricula = this.matriculaRepo.create({
          aprendiz: persona,
          curso: curso,
          estado: 'ACTIVA'
        });
        await this.matriculaRepo.save(matricula);

        result.exitosos++;
        result.detalles.push({ fila: row.number, success: true, message: `Usuario ${dtoObj.nombre_completo} creado y matriculado exitosamente.` });
      } catch (err: any) {
        result.fallidos++;
        result.detalles.push({ fila: row.number, error: err.message });
      }
    }

    return result;
  }
}
