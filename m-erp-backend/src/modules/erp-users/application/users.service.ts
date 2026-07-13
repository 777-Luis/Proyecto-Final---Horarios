import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Brackets } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Usuario } from '../domain/usuario.entity';
import { Persona } from '../domain/persona.entity';
import { Credencial } from '../domain/credencial.entity';
import { Rol } from '../domain/rol.entity';
import { Permiso } from '../domain/permiso.entity';
import { Municipio } from '../../erp-locations/domain/municipio.entity';
import { Aplicativo } from '../domain/aplicativo.entity';

import { CreateUserDto } from '../infrastructure/controllers/dtos/create-user.dto';
import { FilterUsersDto } from '../infrastructure/controllers/dtos/filter-users.dto';

import { Matricula } from '../../erp-academics/domain/matricula.entity';
import { Curso } from '../../erp-academics/domain/curso.entity';
import { Area } from '../../erp-centers/domain/area.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Persona) private personaRepo: Repository<Persona>,
    @InjectRepository(Credencial) private credencialRepo: Repository<Credencial>,
    @InjectRepository(Rol) private rolRepo: Repository<Rol>,
    @InjectRepository(Permiso) private permisoRepo: Repository<Permiso>,
    @InjectRepository(Municipio) private municipioRepo: Repository<Municipio>,
    @InjectRepository(Aplicativo) private aplicativoRepo: Repository<Aplicativo>,
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    private dataSource: DataSource,
  ) {}

  async findAllPaginated(filter: FilterUsersDto) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const qb = this.usuarioRepo.createQueryBuilder('u')
      .leftJoinAndSelect('u.persona', 'p')
      .leftJoinAndSelect('p.municipio', 'm')
      .leftJoinAndSelect('u.rol', 'r')
      .leftJoinAndSelect('u.credencial', 'c');

    if (filter.role) {
      qb.andWhere('r.nombre = :role', { role: filter.role });

      // Cascading logic based on Role
      if (filter.role === 'Aprendiz') {
        qb.leftJoin(Matricula, 'mat', 'mat.aprendiz_id = p.id')
          .leftJoin(Curso, 'cur', 'mat.curso_id = cur.id');
        
        if (filter.curso_id) qb.andWhere('cur.id = :curso_id', { curso_id: filter.curso_id });
        if (filter.programa_id) qb.andWhere('cur.programa_id = :programa_id', { programa_id: filter.programa_id });
        if (filter.area_id) qb.andWhere('cur.area_id = :area_id', { area_id: filter.area_id });
      } 
      else if (filter.role === 'Instructor') {
        qb.leftJoin('u.area', 'area');
        
        if (filter.area_id) qb.andWhere('area.id = :area_id', { area_id: filter.area_id });
      } 
    }

    if (filter.search) {
      qb.andWhere(new Brackets(b => {
        b.where('p.nombre ILIKE :search', { search: `%${filter.search}%` })
         .orWhere('p.numero_documento ILIKE :search', { search: `%${filter.search}%` })
         .orWhere('c.username ILIKE :search', { search: `%${filter.search}%` });
      }));
    }

    const [items, total] = await qb.skip(skip).take(limit).getManyAndCount();

    const data = await Promise.all(items.map(async u => {
      let es_lider_area = false;
      let nombre_area = null;
      let es_lider_ficha = false;
      let numero_ficha = null;

      if (filter.role === 'Instructor' && u.persona) {
         const areaLider = await this.areaRepo.findOne({ where: { lider: { id: u.persona.id } } });
         if (areaLider) {
            es_lider_area = true;
            nombre_area = areaLider.nombre;
         }
         
         const cursoLider = await this.dataSource.getRepository(Curso).findOne({ where: { lider: { id: u.persona.id } } });
         if (cursoLider) {
            es_lider_ficha = true;
            numero_ficha = cursoLider.id_curso;
         }
      }

      return {
        id: u.id,
        nombre: u.persona?.nombre,
        apellido: u.persona?.apellido,
        identificacion: u.persona?.numero_documento,
        correo: u.persona?.correo,
        estado: u.estado,
        municipio: u.persona?.municipio?.nombre,
        rol: u.rol?.nombre,
        es_lider_area,
        nombre_area,
        es_lider_ficha,
        numero_ficha,
        persona_id: u.persona?.id // useful for auth/frontend checks
      };
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async findOneIndividual(id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: ['persona', 'persona.municipio', 'credencial', 'rol', 'area']
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    return {
      id: usuario.id,
      nombre: usuario.persona?.nombre,
      apellido: usuario.persona?.apellido,
      tipo_documento: usuario.persona?.tipo_documento,
      numero_documento: usuario.persona?.numero_documento,
      correo: usuario.persona?.correo,
      direccion: usuario.persona?.direccion,
      municipio_id: usuario.persona?.municipio?.id,
      genero: usuario.persona?.genero,
      rol: usuario.rol?.nombre,
      estado: usuario.estado,
      area_id: usuario.area?.id
    };
  }

  private async generateUniqueUsername(nombre: string, apellido: string = ''): Promise<string> {
    const cleanStr = (str: string) => str ? str.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') : '';
    const nombreParts = cleanStr(nombre).split(/\s+/);
    const apellidoParts = cleanStr(apellido).split(/\s+/);
    
    let base = nombreParts[0];
    
    if (apellidoParts.length > 0 && apellidoParts[0] !== '') {
      base += '.' + apellidoParts[0];
    } else if (nombreParts.length >= 3) {
      base += '.' + nombreParts[2];
    } else if (nombreParts.length === 2) {
      base += '.' + nombreParts[1];
    }

    let finalUsername = base;
    let counter = 1;

    while (true) {
      const existing = await this.credencialRepo.findOne({ where: { username: finalUsername } });
      if (!existing) break;
      finalUsername = `${base}${counter}`;
      counter++;
    }

    return finalUsername;
  }

  async createIndividual(dto: CreateUserDto) {
    const existingCreds = await this.credencialRepo.findOne({ where: { username: dto.correo } });
    if (existingCreds) {
      throw new ConflictException(`El correo ${dto.correo} ya está en uso.`);
    }

    const existingDoc = await this.personaRepo.findOne({ where: { numero_documento: dto.numero_documento } });
    if (existingDoc) {
      throw new ConflictException(`El documento ${dto.numero_documento} ya está registrado.`);
    }

    const municipio = await this.municipioRepo.findOne({ where: { id: dto.municipio_id } });
    if (!municipio) throw new NotFoundException('Municipio no encontrado.');

    let rol = await this.rolRepo.findOne({ where: { nombre: dto.rol_nombre } });
    if (!rol) {
      rol = this.rolRepo.create({ nombre: dto.rol_nombre, descripcion: `Rol del sistema: ${dto.rol_nombre}` });
      await this.rolRepo.save(rol);
    }

    let areaObj = null;
    if (dto.rol_nombre === 'Instructor') {
      if (!dto.area_id) {
        throw new ConflictException('El campo area_id es obligatorio para el rol Instructor.');
      }
      areaObj = await this.areaRepo.findOne({ where: { id: dto.area_id } });
      if (!areaObj) throw new NotFoundException('Área no encontrada.');
    }

    // These saves run under the request-scoped transaction (started by
    // TenantInterceptor) via the injected repositories, instead of a standalone
    // queryRunner/connection, so they share the same RLS tenant context as the
    // rest of the request.

    // 1. Create Persona
    const persona = this.personaRepo.create({
      nombre: dto.nombre,
      apellido: dto.apellido,
      cargo: ['Aprendiz', 'Instructor', 'Administrador'].includes(dto.rol_nombre) ? dto.rol_nombre as any : null,
      tipo_documento: dto.tipo_documento,
      numero_documento: dto.numero_documento,
      correo: dto.correo,
      direccion: dto.direccion,
      municipio: municipio,
      genero: dto.genero,
    });
    await this.personaRepo.save(persona);

    // 2. Create Credencial
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(dto.password, salt);
    const generatedUsername = await this.generateUniqueUsername(dto.nombre, dto.apellido);
    const credencial = this.credencialRepo.create({
      username: generatedUsername,
      password_hash: hash,
      ultimo_acceso: new Date(),
    });
    await this.credencialRepo.save(credencial);

    // 3. Create Usuario
    const usuario = this.usuarioRepo.create({
      persona,
      credencial,
      rol,
      area: areaObj || undefined,
    });
    await this.usuarioRepo.save(usuario);

    // 4. Assign Aplicativos permissions
    if (dto.aplicativos_ids && dto.aplicativos_ids.length > 0) {
      for (const appId of dto.aplicativos_ids) {
        const apiObj = await this.aplicativoRepo.findOne({ where: { id: appId } });
        if (apiObj) {
          const permiso = this.permisoRepo.create({
            usuario: usuario,
            aplicativo: apiObj,
          });
          await this.permisoRepo.save(permiso);
        }
      }
    }

    return { message: 'Usuario creado exitosamente', id: usuario.id, username: credencial.username };
  }

  async toggleStatus(id: string) {
    const usuario = await this.usuarioRepo.findOne({ where: { id } });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    usuario.estado = !usuario.estado;
    await this.usuarioRepo.save(usuario);
    return { message: `Estado actualizado a ${usuario.estado ? 'Activo' : 'Inactivo'}`, estado: usuario.estado };
  }

  async updateIndividual(id: string, dto: any) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: ['persona', 'credencial', 'rol']
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Update Persona
    if (dto.municipio_id) {
      const municipio = await this.municipioRepo.findOne({ where: { id: dto.municipio_id } });
      if (municipio) usuario.persona.municipio = municipio;
    }
    usuario.persona.nombre = dto.nombre ?? usuario.persona.nombre;
    usuario.persona.apellido = dto.apellido ?? usuario.persona.apellido;
    usuario.persona.tipo_documento = dto.tipo_documento ?? usuario.persona.tipo_documento;
    usuario.persona.numero_documento = dto.numero_documento ?? usuario.persona.numero_documento;
    usuario.persona.correo = dto.correo ?? usuario.persona.correo;
    usuario.persona.direccion = dto.direccion ?? usuario.persona.direccion;
    usuario.persona.genero = dto.genero ?? usuario.persona.genero;
    await this.personaRepo.save(usuario.persona);

    // Update Rol & Area
    let targetRole = usuario.rol?.nombre;
    if (dto.rol_nombre && usuario.rol?.nombre !== dto.rol_nombre) {
      let rol = await this.rolRepo.findOne({ where: { nombre: dto.rol_nombre } });
      if (!rol) {
        rol = this.rolRepo.create({ nombre: dto.rol_nombre, descripcion: `Rol del sistema: ${dto.rol_nombre}` });
        await this.rolRepo.save(rol);
      }
      usuario.rol = rol;
      targetRole = dto.rol_nombre;
    }

    if (targetRole === 'Instructor') {
      if (dto.area_id) {
        const areaObj = await this.areaRepo.findOne({ where: { id: dto.area_id } });
        if (!areaObj) throw new NotFoundException('Área no encontrada.');
        usuario.area = areaObj;
      } else if (!usuario.area) {
        throw new ConflictException('El campo area_id es obligatorio para el rol Instructor.');
      }
    } else {
      usuario.area = null as any;
    }
    await this.usuarioRepo.save(usuario);

    // Update Credencial (Password)
    if (dto.password && dto.password.trim() !== '') {
      const salt = await bcrypt.genSalt(10);
      usuario.credencial.password_hash = await bcrypt.hash(dto.password, salt);
      await this.credencialRepo.save(usuario.credencial);
    }

    return { message: 'Usuario actualizado exitosamente' };
  }

  async deleteIndividual(id: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id },
      relations: ['persona', 'credencial']
    });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    // Because of constraints, we delete Permisos/Matriculas/etc manually or rely on cascading.
    // Usually, deleting the user propagates. If it fails, manual deletions are needed!
    await this.dataSource.query(`DELETE FROM accesos WHERE usuario_id = $1`, [usuario.id]);
    await this.dataSource.query(`DELETE FROM permisos WHERE usuario_id = $1`, [usuario.id]);
    if (usuario.persona) {
      await this.dataSource.query(`DELETE FROM matriculas WHERE aprendiz_id = $1`, [usuario.persona.id]);
    }
    await this.usuarioRepo.delete(usuario.id);
    if (usuario.credencial) await this.credencialRepo.delete(usuario.credencial.id);
    if (usuario.persona) await this.personaRepo.delete(usuario.persona.id);
    return { message: 'Usuario eliminado exitosamente' };
  }

  async getPoblacionStats() {
    const areas = await this.areaRepo.find();
    
    // Instructores por área
    const instructoresRaw = await this.usuarioRepo.createQueryBuilder('u')
      .leftJoin('u.rol', 'r')
      .select('u.area_id', 'area_id')
      .addSelect('COUNT(u.id)', 'count')
      .where('r.nombre = :role', { role: 'Instructor' })
      .andWhere('u.area_id IS NOT NULL')
      .groupBy('u.area_id')
      .getRawMany();

    // Aprendices por área (via matriculas -> curso -> area)
    const aprendicesRaw = await this.usuarioRepo.createQueryBuilder('u')
      .leftJoin('u.rol', 'r')
      .leftJoin(Matricula, 'mat', 'mat.aprendiz_id = u.persona_id')
      .leftJoin(Curso, 'cur', 'mat.curso_id = cur.id')
      .select('cur.area_id', 'area_id')
      .addSelect('COUNT(DISTINCT u.id)', 'count')
      .where('r.nombre = :role', { role: 'Aprendiz' })
      .andWhere('cur.area_id IS NOT NULL')
      .groupBy('cur.area_id')
      .getRawMany();

    return areas.map(a => {
      const instCount = parseInt(instructoresRaw.find(r => r.area_id === a.id)?.count || '0', 10);
      const aprCount = parseInt(aprendicesRaw.find(r => r.area_id === a.id)?.count || '0', 10);
      return {
        area: a.nombre,
        instructores: instCount,
        aprendices: aprCount
      };
    });
  }
}

