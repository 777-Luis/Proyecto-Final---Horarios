import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import PDFDocument = require('pdfkit');

import { Horario } from '../domain/horario.entity';
import { HorarioDetalle } from '../domain/horario-detalle.entity';

@Injectable()
export class HorariosService {
  constructor(
    @InjectRepository(Horario) private readonly horarioRepo: Repository<Horario>,
    @InjectRepository(HorarioDetalle) private readonly detalleRepo: Repository<HorarioDetalle>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private get apiUrl() {
    const port = this.configService.get('PORT') || 3000;
    return this.configService.get('API_PRINCIPAL_URL') || `http://localhost:${port}/api/erp/v1`;
  }

  // ======= MICROSERVICE HTTP BINDINGS =======
  async fetchCursosDisponibles(token: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.apiUrl}/cursos/sin-horario`, {
          headers: { Authorization: token },
        })
      );
      return data;
    } catch (e) {
      throw new BadRequestException('Error aislando microservicio (API Horarios a API Principal): No se pudieron obtener los cursos.');
    }
  }

  async fetchAmbientesDisponibles(token: string, jornada: string, ignoreCursoId?: string) {
    try {
      const url = ignoreCursoId
        ? `${this.apiUrl}/ambientes/disponibles?jornada=${jornada}&ignore_curso_id=${ignoreCursoId}`
        : `${this.apiUrl}/ambientes/disponibles?jornada=${jornada}`;
      const { data } = await firstValueFrom(
        this.httpService.get(url, {
          headers: { Authorization: token },
        })
      );
      return data;
    } catch (e) {
      throw new BadRequestException('Error aislando microservicio (API Horarios a API Principal): No se pudo obtener los ambientes.');
    }
  }

  // ======= CORE DOMAIN LOGIC =======

  async create(dto: any, token: string) {
    // 1. Cross-API Validations (Isolated)
    const cursos = await this.fetchCursosDisponibles(token);
    if (!cursos.find((c: any) => c.id === dto.curso_id)) {
      throw new ConflictException('El curso indicado no está disponible o ya posee un horario definitivo.');
    }

    const ambientes = await this.fetchAmbientesDisponibles(token, dto.jornada, dto.curso_id);
    if (!ambientes.find((a: any) => a.id === dto.ambiente_id)) {
      throw new ConflictException(`El ambiente no está físicamente libre durante la jornada actual (${dto.jornada}).`);
    }

    // 2. Local Instructor overlaps & Core Rules Validation
    const allDetalles = dto.detalles || [];
    for (const det of allDetalles) {
      if (det.es_transversal) {
        if (!det.hora_inicio.startsWith('08:00') || !det.hora_fin.startsWith('12:00')) {
           throw new BadRequestException('Regla de negocio rota: Las clases transversales obligan una franja fija de 08:00 a 12:00.');
        }
      }

      const overlap = await this.detalleRepo.createQueryBuilder('hd')
        .leftJoin('hd.horario', 'h')
        .where('hd.instructor_id = :instructorId', { instructorId: det.instructor_id })
        .andWhere('hd.dia = :dia', { dia: det.dia })
        .andWhere('h.jornada = :jornada', { jornada: dto.jornada })
        .andWhere(
          '(hd.hora_inicio < :fin AND hd.hora_fin > :inicio)',
          { inicio: det.hora_inicio, fin: det.hora_fin }
        )
        .getOne();

      if (overlap) {
        throw new ConflictException(`Cruce de horario: El instructor ya imparte formación el día ${det.dia} a esa misma franja.`);
      }
    }

    // 3. Persist Graph (Transactionally bound by TypeORM save constraints)
    const horario = this.horarioRepo.create({
      curso: { id: dto.curso_id },
      ambiente: { id: dto.ambiente_id },
      jornada: dto.jornada,
    });
    
    const savedHorario = await this.horarioRepo.save(horario);

    const mapDetalles = allDetalles.map((det: any) => this.detalleRepo.create({
      horario: savedHorario,
      dia: det.dia,
      hora_inicio: det.hora_inicio,
      hora_fin: det.hora_fin,
      instructor: { id: det.instructor_id },
      es_transversal: det.es_transversal || false,
    }));
    
    await this.detalleRepo.save(mapDetalles);

    return savedHorario;
  }

  async findAll() {
    return this.horarioRepo.find({
      relations: ['curso', 'curso.programa', 'curso.area', 'curso.lider', 'ambiente', 'detalles', 'detalles.instructor']
    });
  }

  async getHorario(id: string) {
    const horario = await this.horarioRepo.findOne({
      where: { id },
      relations: ['curso', 'curso.programa', 'curso.area', 'curso.lider', 'ambiente', 'detalles', 'detalles.instructor'],
    });
    if (!horario) throw new NotFoundException('Horario principal no localizado');
    return horario;
  }

  // ======= EXPORT LOGIC =======

  async getHorariosByInstructor(instructorId: string) {
    return this.detalleRepo.find({
      where: { instructor: { id: instructorId } },
      relations: ['horario', 'horario.curso', 'horario.curso.programa', 'horario.ambiente', 'instructor'],
    });
  }

  async getHorariosByAprendiz(aprendizId: string) {
    return this.horarioRepo.createQueryBuilder('h')
      .leftJoinAndSelect('h.curso', 'curso')
      .leftJoinAndSelect('curso.programa', 'programa')
      .leftJoinAndSelect('h.ambiente', 'ambiente')
      .leftJoinAndSelect('h.detalles', 'detalles')
      .leftJoinAndSelect('detalles.instructor', 'instructor')
      .innerJoin('matriculas', 'm', 'm.curso_id = h.curso_id')
      .where('m.aprendiz_id = :aprendizId', { aprendizId })
      .andWhere("m.estado = 'ACTIVA'")
      .getMany();
  }

  async generatePdf(horarioId: string): Promise<Buffer> {
    const horario = await this.getHorario(horarioId);

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const buffers: Buffer[] = [];

      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // --- Header ---
      doc.rect(0, 0, 600, 80).fill('#1B5C3A');
      doc.fontSize(24).fillColor('#ffffff').text('CHRONOGEST', 50, 25, { continued: true });
      doc.fontSize(14).text(' | Reporte de Planeación', { align: 'left' });
      doc.moveDown(3);

      // --- Info Section ---
      doc.rect(50, 100, 495, 85).fillAndStroke('#F3F4F6', '#E5E7EB');
      
      doc.fontSize(12).fillColor('#111827');
      doc.text('Ficha Titulación:', 70, 115, { continued: true }).font('Helvetica-Bold').text(` ${horario.curso?.id_curso || 'N/A'}`);
      doc.font('Helvetica').text('Programa:', 70, 135, { continued: true }).font('Helvetica-Bold').text(` ${horario.curso?.programa?.nombre || 'N/A'}`);
      doc.font('Helvetica').text('Área:', 70, 155, { continued: true }).font('Helvetica-Bold').text(` ${horario.curso?.area?.nombre || 'N/A'}`);
      
      doc.font('Helvetica').text('Jornada:', 300, 115, { continued: true }).font('Helvetica-Bold').text(` ${horario.jornada}`);
      doc.font('Helvetica').text('Ambiente:', 300, 135, { continued: true }).font('Helvetica-Bold').text(` ${horario.ambiente?.nombre || 'N/A'}`);
      
      // --- Table Header ---
      doc.moveDown(4);
      let currentY = 220;
      doc.fontSize(14).fillColor('#1B5C3A').font('Helvetica-Bold').text('Detalle de Horario y Competencias', 50, currentY);
      currentY += 25;

      const colX = [50, 120, 210, 280, 390];
      const colW = [70, 90, 70, 110, 155];
      const headers = ['Día', 'Franja', 'Tipo', 'Instructor', 'Competencia'];

      doc.rect(50, currentY, 495, 20).fill('#2E7D52');
      doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
      for (let i = 0; i < headers.length; i++) {
        doc.text(headers[i], colX[i] + 5, currentY + 5, { width: colW[i] - 10, align: 'left' });
      }
      currentY += 20;

      // --- Table Body ---
      doc.font('Helvetica').fontSize(9).fillColor('#374151');
      const diasStr = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      
      let isAlt = false;
      horario.detalles.forEach(det => {
         const tipo = det.es_transversal ? 'Transversal' : 'Técnica';
         const dia = diasStr[det.dia];
         const horas = `${det.hora_inicio.substring(0,5)} - ${det.hora_fin.substring(0,5)}`;
         const inst = det.instructor ? `${det.instructor.nombre} ${det.instructor.apellido || ''}` : 'Pendiente';
         const comp = det.competencia || 'Sin asignar';

         const textHeight = doc.heightOfString(comp, { width: colW[4] - 10 });
         const rowHeight = Math.max(25, textHeight + 14);

         if (currentY + rowHeight > 750) {
            doc.addPage();
            currentY = 50;
            doc.rect(50, currentY, 495, 20).fill('#2E7D52');
            doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
            for (let i = 0; i < headers.length; i++) {
              doc.text(headers[i], colX[i] + 5, currentY + 5, { width: colW[i] - 10, align: 'left' });
            }
            currentY += 20;
            doc.font('Helvetica').fontSize(9).fillColor('#374151');
         }

         if (isAlt) {
           doc.rect(50, currentY, 495, rowHeight).fill('#F9FAFB');
         }
         doc.rect(50, currentY, 495, rowHeight).stroke('#E5E7EB');
         doc.fillColor('#374151');
         
         doc.text(dia, colX[0] + 5, currentY + 8, { width: colW[0] - 10 });
         doc.text(horas, colX[1] + 5, currentY + 8, { width: colW[1] - 10 });
         
         if (det.es_transversal) {
           doc.rect(colX[2] + 5, currentY + 6, 60, 14).fill('#FEF08A');
           doc.fillColor('#854D0E').text(tipo, colX[2] + 5, currentY + 8, { width: 60, align: 'center' });
         } else {
           doc.rect(colX[2] + 5, currentY + 6, 60, 14).fill('#DBEAFE');
           doc.fillColor('#1E40AF').text(tipo, colX[2] + 5, currentY + 8, { width: 60, align: 'center' });
         }
         doc.fillColor('#374151');

         doc.text(inst, colX[3] + 5, currentY + 8, { width: colW[3] - 10 });
         doc.text(comp, colX[4] + 5, currentY + 8, { width: colW[4] - 10 });

         currentY += rowHeight;
         isAlt = !isAlt;
      });

      doc.end();
    });
  }

  async obtenerDetallesPorDia(dia: number): Promise<HorarioDetalle[]> {
    return this.detalleRepo.find({
      where: { dia },
      relations: ['horario', 'instructor'],
    });
  }

  async addDetalle(horarioId: string, det: any) {
    const horario = await this.horarioRepo.findOne({ where: { id: horarioId } });
    if (!horario) throw new NotFoundException('Horario no encontrado');

    if (det.es_transversal) {
      if (!det.hora_inicio.startsWith('08:00') || !det.hora_fin.startsWith('12:00')) {
         throw new BadRequestException('Regla de negocio rota: Las clases transversales obligan una franja fija de 08:00 a 12:00.');
      }
    }

    const overlap = await this.detalleRepo.createQueryBuilder('hd')
      .leftJoin('hd.horario', 'h')
      .where('hd.instructor_id = :instructorId', { instructorId: det.instructor_id })
      .andWhere('hd.dia = :dia', { dia: det.dia })
      .andWhere('h.jornada = :jornada', { jornada: horario.jornada })
      .andWhere(
        '(hd.hora_inicio < :fin AND hd.hora_fin > :inicio)',
        { inicio: det.hora_inicio, fin: det.hora_fin }
      )
      .getOne();

    if (overlap) {
      throw new ConflictException(`Cruce de horario: El instructor ya imparte formación el día ${det.dia} a esa misma franja.`);
    }

    const detalle = this.detalleRepo.create({
      horario: horario,
      dia: det.dia,
      hora_inicio: det.hora_inicio,
      hora_fin: det.hora_fin,
      instructor: { id: det.instructor_id },
      es_transversal: det.es_transversal || false,
    });

    return this.detalleRepo.save(detalle);
  }

  async updateDetalle(id: string, payload: any) {
    const detalle = await this.detalleRepo.findOne({ 
      where: { id },
      relations: ['horario', 'instructor'] 
    });
    if (!detalle) throw new NotFoundException('Detalle no encontrado');

    // Mapear campos de detalles_propuestos
    const nuevoInstructorId = payload.instructor_propuesto_id || payload.instructor_id;
    const nuevaHoraInicio = payload.hora_inicio_propuesta || payload.hora_inicio;
    const nuevaHoraFin = payload.hora_fin_propuesta || payload.hora_fin;
    const nuevoDiaStr = payload.dia_propuesto || payload.dia;

    if (nuevoInstructorId) {
      detalle.instructor = { id: nuevoInstructorId } as any;
    }
    if (nuevaHoraInicio) detalle.hora_inicio = nuevaHoraInicio;
    if (nuevaHoraFin) detalle.hora_fin = nuevaHoraFin;
    
    // Mapeo del día
    if (nuevoDiaStr) {
      const dayMap: { [key: string]: number } = {
        'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6, 'Domingo': 0
      };
      if (typeof nuevoDiaStr === 'string' && dayMap[nuevoDiaStr] !== undefined) {
         detalle.dia = dayMap[nuevoDiaStr];
      } else if (typeof nuevoDiaStr === 'number') {
         detalle.dia = nuevoDiaStr;
      }
    }
    
    if (payload.competencia !== undefined) detalle.competencia = payload.competencia;
    if (payload.resultado !== undefined) detalle.resultado = payload.resultado;
    if (payload.fecha_inicio_competencia !== undefined) detalle.fecha_inicio_competencia = payload.fecha_inicio_competencia;
    if (payload.fecha_fin_competencia !== undefined) detalle.fecha_fin_competencia = payload.fecha_fin_competencia;

    await this.detalleRepo.save(detalle);

    if (payload.aplicar_todos) {
      await this.detalleRepo.createQueryBuilder()
        .update(HorarioDetalle)
        .set({
          competencia: detalle.competencia,
          resultado: detalle.resultado,
          fecha_inicio_competencia: detalle.fecha_inicio_competencia,
          fecha_fin_competencia: detalle.fecha_fin_competencia
        })
        .where('horario_id = :horarioId', { horarioId: detalle.horario.id })
        .andWhere('instructor_id = :instructorId', { instructorId: detalle.instructor.id })
        .execute();
    }

    return detalle;
  }

  async deleteDetalle(id: string) {
    const detalle = await this.detalleRepo.findOne({ where: { id } });
    if (!detalle) throw new NotFoundException('Detalle no encontrado');

    await this.detalleRepo.remove(detalle);
    return { success: true };
  }
}
