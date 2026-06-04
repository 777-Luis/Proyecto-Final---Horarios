import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Aplicativo } from '../domain/aplicativo.entity';
import { Acceso } from '../domain/acceso.entity';
import { Permiso } from '../domain/permiso.entity';

@Injectable()
export class SystemConfigService {
  constructor(
    @InjectRepository(Aplicativo) private aplicativoRepo: Repository<Aplicativo>,
    @InjectRepository(Acceso) private accesoRepo: Repository<Acceso>,
    @InjectRepository(Permiso) private permisoRepo: Repository<Permiso>,
  ) {}

  // --- APLICATIVOS ---
  async getAplicativos() {
    return this.aplicativoRepo.find({ order: { nombre: 'ASC' } });
  }

  async createAplicativo(data: any) {
    if (!data.nombre) throw new BadRequestException('El nombre es requerido');
    const app = this.aplicativoRepo.create({
      nombre: data.nombre,
      descripcion: data.descripcion || '',
    });
    return this.aplicativoRepo.save(app);
  }

  async updateAplicativo(id: string, data: any) {
    const app = await this.aplicativoRepo.findOne({ where: { id } });
    if (!app) throw new NotFoundException('Aplicativo no encontrado');
    if (data.nombre) app.nombre = data.nombre;
    if (data.descripcion !== undefined) app.descripcion = data.descripcion;
    return this.aplicativoRepo.save(app);
  }

  async deleteAplicativo(id: string) {
    const countPermisos = await this.permisoRepo.count({ where: { aplicativo: { id } } });
    if (countPermisos > 0) {
      throw new ConflictException('No se puede eliminar el aplicativo porque hay usuarios con permisos asignados.');
    }
    const countAccesos = await this.accesoRepo.count({ where: { aplicativo: { id } } });
    if (countAccesos > 0) {
      throw new ConflictException('No se puede eliminar el aplicativo porque tiene registros de acceso de auditoría.');
    }
    await this.aplicativoRepo.delete(id);
    return { success: true };
  }

  // --- ACCESOS (SOLO LECTURA) ---
  async getAccesos(filters: any) {
    const query = this.accesoRepo.createQueryBuilder('a')
      .leftJoinAndSelect('a.usuario', 'u')
      .leftJoinAndSelect('u.credencial', 'c')
      .leftJoinAndSelect('a.aplicativo', 'app')
      .orderBy('a.fecha_hora', 'DESC');

    if (filters.search) {
      query.andWhere('c.username ILIKE :search', { search: `%${filters.search}%` });
    }
    if (filters.aplicativo_id) {
      query.andWhere('app.id = :appId', { appId: filters.aplicativo_id });
    }
    if (filters.start_date) {
      query.andWhere('a.fecha_hora >= :start', { start: filters.start_date });
    }
    if (filters.end_date) {
      query.andWhere('a.fecha_hora <= :end', { end: filters.end_date });
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await query.skip(skip).take(limit).getManyAndCount();

    return {
      data: items.map(acc => ({
        id: acc.id,
        usuario: acc.usuario?.credencial?.username,
        aplicativo: acc.aplicativo?.nombre,
        fecha: acc.fecha_hora,
        ip: acc.ip
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }
}
