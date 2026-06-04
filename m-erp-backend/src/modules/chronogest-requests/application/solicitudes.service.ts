import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SolicitudCambio } from '../domain/solicitud-cambio.entity';
import { NotificacionesService } from './notificaciones.service';
import { Usuario } from '../../erp-users/domain/usuario.entity';
import { HorariosService } from '../../chronogest-schedules/application/horarios.service';

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudCambio) private readonly repo: Repository<SolicitudCambio>,
    @InjectRepository(Usuario) private readonly userRepo: Repository<Usuario>,
    private readonly notificacionesService: NotificacionesService,
    private readonly horariosService: HorariosService,
  ) {}

  async findAll(userId: string, role: string, estado?: string) {
    const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['persona'] });
    const personaId = user?.persona?.id;

    const qb = this.repo.createQueryBuilder('sol')
      .leftJoinAndSelect('sol.instructor', 'instructor')
      .leftJoinAndSelect('sol.lider_area', 'lider_area')
      .orderBy('sol.fecha_solicitud', 'DESC')
      .take(50);

    if (role === 'Administrador') {
      if (estado) {
        qb.where("sol.estado = :estado", { estado });
      } else {
        qb.where("sol.estado != 'PENDIENTE'");
      }
    } else {
      // Instructor o Lider_Area
      if (!personaId) return [];
      qb.where("(instructor.id = :personaId OR lider_area.id = :personaId)", { personaId });
      if (estado) qb.andWhere("sol.estado = :estado", { estado });
    }
    return qb.getMany();
  }

  // 1. Líder crea solicitud y va directo al admin
  async createDirectByLider(instructorId: string, liderUserId: string, tipo_solicitud: string, descripcion: string, detalles_propuestos?: Record<string, any>) {
    const liderUser = await this.userRepo.findOne({ where: { id: liderUserId }, relations: ['persona'] });
    if (!liderUser || !liderUser.persona) throw new NotFoundException('Líder no encontrado');

    const solicitud = this.repo.create({
      instructor: { id: instructorId },
      lider_area: { id: liderUser.persona.id },
      tipo_solicitud,
      descripcion,
      detalles_propuestos,
      estado: 'enviado_admin',
      fecha_envio_admin: new Date()
    });
    
    const saved = await this.repo.save(solicitud);
    return saved;
  }

  async setEnviarAdmin(id: string, userId: string) {
    const sol = await this.repo.findOne({ where: { id }, relations: ['instructor', 'lider_area'] });
    if (!sol) throw new NotFoundException('Solicitud no encontrada');
    if (sol.estado !== 'PENDIENTE') throw new BadRequestException('Esta solicitud no está pendiente');

    const currentUser = await this.userRepo.findOne({ where: { id: userId }, relations: ['persona'] });
    if (!currentUser || currentUser.persona?.id !== sol.lider_area?.id) {
       throw new UnauthorizedException('Solo el líder del área asiganado a la solicitud puede reenviarla.');
    }

    sol.estado = 'ENVIADO_ADMIN';
    sol.fecha_envio_admin = new Date();
    await this.repo.save(sol);

    return sol;
  }

  async resolverAdmin(id: string, aprobado: boolean, observaciones: string) {
    const sol = await this.repo.findOne({ where: { id }, relations: ['instructor', 'lider_area'] });
    if (!sol) throw new NotFoundException('Solicitud no encontrada');
    if (sol.estado !== 'enviado_admin' && sol.estado !== 'ENVIADO_ADMIN') {
        throw new BadRequestException('La solicitud no ha sido enviada al administrador.');
    }

    if (!aprobado && (!observaciones || observaciones.trim() === '')) {
       throw new BadRequestException('Las observaciones son obligatorias al rechazar.');
    }

    sol.estado = aprobado ? 'aprobado' : 'rechazado';
    sol.observaciones_admin = observaciones;
    sol.fecha_respuesta_admin = new Date();
    await this.repo.save(sol);

    // Si es aprobado y tiene detalles propuestos, intentar aplicar el cambio
    if (aprobado && sol.detalles_propuestos && sol.detalles_propuestos.horario_detalle_id) {
       try {
         // Reutilizar la lógica de HorariosService para verificar cruces
         await this.horariosService.updateDetalle(
           sol.detalles_propuestos.horario_detalle_id, 
           sol.detalles_propuestos
         );
       } catch (err: any) {
         // Si hay error (ej. cruce), revertir la aprobación
         sol.estado = 'enviado_admin';
         sol.observaciones_admin = '';
         sol.fecha_respuesta_admin = null as any;
         await this.repo.save(sol);
         throw new BadRequestException('No se pudo aplicar el cambio automáticamente: ' + err.message);
       }
    }

    // Notificar al instructor
    const instructorUser = await this.userRepo.findOne({ where: { persona: { id: sol.instructor.id } } });
    if (instructorUser) {
      await this.notificacionesService.create(
        instructorUser.id,
        `Tu solicitud de ${sol.tipo_solicitud} ha sido ${aprobado ? 'Aprobada' : 'Rechazada'}. Observaciones: ${observaciones || 'Ninguna'}`,
        sol.id
      );
    }

    // Notificar al líder
    const liderUser = await this.userRepo.findOne({ where: { persona: { id: sol.lider_area.id } } });
    if (liderUser && instructorUser?.id !== liderUser.id) {
      await this.notificacionesService.create(
        liderUser.id,
        `La solicitud de ${sol.tipo_solicitud} para ${sol.instructor.nombre} ha sido ${aprobado ? 'Aprobada' : 'Rechazada'}.`,
        sol.id
      );
    }

    return sol;
  }
}
