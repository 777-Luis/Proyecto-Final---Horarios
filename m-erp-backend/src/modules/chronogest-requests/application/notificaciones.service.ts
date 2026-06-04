import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notificacion } from '../domain/notificacion.entity';

@Injectable()
export class NotificacionesService {
  constructor(
    @InjectRepository(Notificacion) private readonly repo: Repository<Notificacion>,
  ) {}

  async create(usuarioId: string, mensaje: string, referenciaSolicitudId?: string) {
    const obj = this.repo.create({
      usuario: { id: usuarioId },
      mensaje,
      referencia_solicitud: referenciaSolicitudId ? { id: referenciaSolicitudId } : undefined,
    });
    return this.repo.save(obj);
  }

  async findMisNotificaciones(usuarioId: string) {
    return this.repo.find({
      where: { usuario: { id: usuarioId } },
      order: { fecha: 'DESC' },
      relations: ['referencia_solicitud'],
    });
  }

  async markAsRead(id: string, usuarioId: string) {
    const notif = await this.repo.findOne({ where: { id, usuario: { id: usuarioId } } });
    if (!notif) throw new NotFoundException(`Notificación no encontrada o no pertenece al usuario`);
    notif.leida = true;
    await this.repo.save(notif);
    return { success: true };
  }
}
