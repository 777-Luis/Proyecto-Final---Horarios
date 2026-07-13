import { Injectable } from '@nestjs/common';
import { InjectRepository, InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Tenant } from '../../erp-centers/domain/entities/tenant.entity';
import { Usuario } from '../../erp-users/domain/usuario.entity';
import { Persona } from '../../erp-users/domain/persona.entity';

@Injectable()
export class SuperadminService {
  constructor(
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona) private personaRepo: Repository<Persona>,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async getDashboardStats() {
    const totalSedes = await this.tenantRepo.count();
    const totalUsuarios = await this.usuarioRepo.count();

    const [{ count: totalFichas }] = await this.dataSource.query(
      `SELECT COUNT(*) FROM cursos WHERE estado = 'Activo'`,
    );
    const [{ count: totalClasesHoy }] = await this.dataSource.query(
      `SELECT COUNT(*) FROM registro_clases WHERE fecha = CURRENT_DATE`,
    );

    return {
      totalSedes,
      totalUsuarios,
      totalFichas: Number(totalFichas),
      totalClasesHoy: Number(totalClasesHoy),
    };
  }

  async getSedes() {
    return this.tenantRepo.find();
  }

  async createSede(data: Partial<Tenant>) {
    const tenant = this.tenantRepo.create(data);
    return this.tenantRepo.save(tenant);
  }

  async updateSede(id: string, data: Partial<Tenant>) {
    await this.tenantRepo.update(id, data);
    return this.tenantRepo.findOne({ where: { id } });
  }

  async deleteSede(id: string) {
    return this.tenantRepo.delete(id);
  }

  async getUsuarios() {
    const usuarios = await this.usuarioRepo.find({ relations: ['persona', 'rol', 'credencial'] });
    const tenants = await this.tenantRepo.find();
    
    return usuarios.map(u => ({
      ...u,
      username: u.credencial?.username || 'N/A',
      sede_nombre: tenants.find(t => t.id === u.sede_id)?.nombre || (u.sede_id || 'Sin Sede')
    }));
  }

  async getReportes() {
    const usuariosPorSedeYRol = await this.dataSource.query(`
      SELECT t.nombre AS sede, r.nombre AS rol, COUNT(u.id)::int AS total
      FROM usuarios u
      JOIN tenants t ON t.id = u.sede_id
      JOIN roles r ON r.id = u.rol_id
      GROUP BY t.nombre, r.nombre
      ORDER BY t.nombre, r.nombre
    `);

    const cursosPorSede = await this.dataSource.query(`
      SELECT
        t.nombre AS sede,
        COUNT(*) FILTER (WHERE c.estado = 'Activo')::int AS activos,
        COUNT(*) FILTER (WHERE c.estado = 'Activo' AND h.id IS NULL)::int AS sin_horario
      FROM cursos c
      JOIN tenants t ON t.id = c.sede_id
      LEFT JOIN horarios h ON h.curso_id = c.id
      GROUP BY t.nombre
      ORDER BY t.nombre
    `);

    const solicitudesPendientesPorSede = await this.dataSource.query(`
      SELECT t.nombre AS sede, COUNT(*)::int AS pendientes
      FROM solicitudes_cambio s
      JOIN tenants t ON t.id = s.sede_id
      WHERE s.estado = 'PENDIENTE'
      GROUP BY t.nombre
      ORDER BY t.nombre
    `);

    const clasesUltimaSemanaPorSede = await this.dataSource.query(`
      SELECT
        t.nombre AS sede,
        COUNT(*) FILTER (WHERE r.estado = 'activa')::int AS activas,
        COUNT(*) FILTER (WHERE r.estado = 'finalizada')::int AS finalizadas,
        COUNT(*) FILTER (WHERE r.estado = 'suspendida')::int AS suspendidas
      FROM registro_clases r
      JOIN tenants t ON t.id = r.sede_id
      WHERE r.fecha >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY t.nombre
      ORDER BY t.nombre
    `);

    return {
      usuariosPorSedeYRol,
      cursosPorSede,
      solicitudesPendientesPorSede,
      clasesUltimaSemanaPorSede,
    };
  }
}
