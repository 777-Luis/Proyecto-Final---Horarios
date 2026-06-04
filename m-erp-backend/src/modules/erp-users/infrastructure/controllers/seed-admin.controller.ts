import { Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';

import { Rol } from '../../domain/rol.entity';
import { Persona } from '../../domain/persona.entity';
import { Usuario } from '../../domain/usuario.entity';
import { Credencial } from '../../domain/credencial.entity';

@Controller('seed')
export class SeedAdminController {
  constructor(
    @InjectRepository(Rol)
    private readonly rolRepo: Repository<Rol>,
    @InjectRepository(Persona)
    private readonly persRepo: Repository<Persona>,
    @InjectRepository(Usuario)
    private readonly usuRepo: Repository<Usuario>,
    @InjectRepository(Credencial)
    private readonly credRepo: Repository<Credencial>,
    private readonly dataSource: DataSource,
  ) {}

  @Post('municipios')
  async seedMunicipios(@Res() res: any) {
    try {
      console.log('--- Ejecutando Endpoint Seed de Municipios ---');
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();

      try {
        const dptos = [
          {
            nombre: 'Huila',
            ciudades: ['Neiva', 'Pitalito', 'Garzón', 'La Plata', 'Campoalegre', 'Rivera', 'Palermo', 'Gigante', 'Timaná', 'Saladoblanco', 'Acevedo', 'Agrado', 'Aipe', 'Algeciras', 'Altamira', 'Baraya', 'Colombia', 'Elías', 'Hobo', 'Iquira', 'Isnos', 'Nátaga', 'Oporapa', 'Paicol', 'Palestina', 'Pital', 'San Agustín', 'Santa María', 'Suaza', 'Tarqui', 'Tello', 'Teruel', 'Tesalia', 'Villavieja', 'Yaguará']
          },
          {
            nombre: 'Cundinamarca',
            ciudades: ['Bogotá', 'Soacha', 'Facatativá', 'Zipaquirá', 'Chía', 'Mosquera']
          },
          {
            nombre: 'Antioquia',
            ciudades: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Rionegro']
          },
          {
            nombre: 'Valle del Cauca',
            ciudades: ['Cali', 'Palmira', 'Buenaventura', 'Tuluá', 'Buga']
          }
        ];

        let totalInserted = 0;

        for (const dep of dptos) {
          let depId = '';
          const checkDep = await qr.query(`SELECT id FROM public.departamentos WHERE nombre = $1 LIMIT 1`, [dep.nombre]);
          if (checkDep.length > 0) {
            depId = checkDep[0].id;
          } else {
            const resultDep = await qr.query(`INSERT INTO public.departamentos (nombre) VALUES ($1) RETURNING id`, [dep.nombre]);
            depId = resultDep[0].id;
          }

          for (const mun of dep.ciudades) {
            const checkMun = await qr.query(`SELECT id FROM public.municipios WHERE nombre = $1 AND departamento_id = $2 LIMIT 1`, [mun, depId]);
            if (checkMun.length === 0) {
              await qr.query(`INSERT INTO public.municipios (nombre, departamento_id) VALUES ($1, $2)`, [mun, depId]);
              totalInserted++;
            }
          }
        }

        await qr.commitTransaction();
        return res.status(HttpStatus.OK).json({ success: true, message: `Se insertaron ${totalInserted} municipios correctamente.` });
      } catch (err) {
        await qr.rollbackTransaction();
        throw err;
      } finally {
        await qr.release();
      }
    } catch (error) {
      console.error('[Seed Municipios] Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: String(error) });
    }
  }

  @Post('datos-prueba')
  async runDatosPrueba(@Res() res: any) {
    try {
      console.log('--- Ejecutando Endpoint Seed de Datos de Prueba ---');
      const qr = this.dataSource.createQueryRunner();
      await qr.connect();
      await qr.startTransaction();

      try {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('Sena123*', salt);

        console.log('Seeding Areas...');
        let areaId = '';
        const existArea = await qr.query(`SELECT id FROM public.areas WHERE nombre = 'TIC' LIMIT 1`);
        if (existArea.length > 0) areaId = existArea[0].id;
        else {
            const areaRes = await qr.query(`INSERT INTO public.areas (nombre, descripcion) VALUES ('TIC', 'Area de Tecnologia y Computacion') RETURNING id`);
            areaId = areaRes[0].id;
        }

        console.log('Seeding Ambientes...');
        const existAmb = await qr.query(`SELECT id FROM public.ambientes WHERE nombre = 'Aula de Software 1' LIMIT 1`);
        if (existAmb.length === 0) {
           await qr.query(`INSERT INTO public.ambientes (nombre, tipo, capacidad, id_area, estado) VALUES ('Aula de Software 1', 'Aula', 30, $1, true)`, [areaId]);
           await qr.query(`INSERT INTO public.ambientes (nombre, tipo, capacidad, id_area, estado) VALUES ('Laboratorio IA', 'Laboratorio', 25, $1, true)`, [areaId]);
        }

        console.log('Seeding Programas...');
        let progId = '';
        const existProg = await qr.query(`SELECT id FROM public.programas WHERE nombre = 'ADSO' LIMIT 1`);
        if (existProg.length > 0) progId = existProg[0].id;
        else {
            const progRes = await qr.query(`INSERT INTO public.programas (nombre, nivel, duracion_meses, id_area, estado) VALUES ('ADSO', 'Tecnólogo', 24, $1, true) RETURNING id`, [areaId]);
            progId = progRes[0].id;
        }

        console.log('Seeding Cursos...');
        let cur1Id = '';
        const existC1 = await qr.query(`SELECT id FROM public.cursos WHERE id_curso = '2550010' LIMIT 1`);
        if (existC1.length > 0) cur1Id = existC1[0].id;
        else {
            const cur1Res = await qr.query(`INSERT INTO public.cursos (id_curso, jornada, modalidad, id_programa, estado) VALUES ('2550010', 'Diurna', 'Presencial', $1, true) RETURNING id`, [progId]);
            cur1Id = cur1Res[0].id;
        }

        let cur2Id = '';
        const existC2 = await qr.query(`SELECT id FROM public.cursos WHERE id_curso = '2550011' LIMIT 1`);
        if (existC2.length > 0) cur2Id = existC2[0].id;
        else {
            const cur2Res = await qr.query(`INSERT INTO public.cursos (id_curso, jornada, modalidad, id_programa, estado) VALUES ('2550011', 'Nocturna', 'Presencial', $1, true) RETURNING id`, [progId]);
            cur2Id = cur2Res[0].id;
        }

        const rolInstRes = await qr.query(`SELECT id FROM public.roles WHERE nombre = 'Instructor'`);
        const rolAprRes = await qr.query(`SELECT id FROM public.roles WHERE nombre = 'Aprendiz'`);
        if(!rolInstRes.length || !rolAprRes.length) {
            throw new Error('Debes correr el seed de admin primero para crear los roles.');
        }
        const rolInstId = rolInstRes[0].id;
        const rolAprId = rolAprRes[0].id;

        console.log('Seeding Instructores...');
        for (let i = 1; i <= 2; i++) {
          const check = await qr.query(`SELECT id FROM public.personas WHERE numero_documento = '1000${i}'`);
          if (check.length === 0) {
            const pers = await qr.query(`INSERT INTO public.personas (nombre, tipo_documento, numero_documento, correo, estado) VALUES ($1, 'CC', $2, $3, true) RETURNING id`, [`Instructor de Prueba ${i}`, `1000${i}`, `inst${i}@sena.com`]);
            const cred = await qr.query(`INSERT INTO public.credenciales (username, password_hash) VALUES ($1, $2) RETURNING id`, [`inst${i}`, hash]);
            await qr.query(`INSERT INTO public.usuarios (id_persona, id_credencial, id_rol, estado) VALUES ($1, $2, $3, true)`, [pers[0].id, cred[0].id, rolInstId]);
          }
        }

        console.log('Seeding Aprendices...');
        for (let i = 1; i <= 2; i++) {
            const check = await qr.query(`SELECT id FROM public.personas WHERE numero_documento = '2000${i}'`);
            if (check.length === 0) {
                const pers = await qr.query(`INSERT INTO public.personas (nombre, tipo_documento, numero_documento, correo, estado) VALUES ($1, 'TI', $2, $3, true) RETURNING id`, [`Aprendiz de Prueba ${i}`, `2000${i}`, `apr${i}@sena.com`]);
                const cred = await qr.query(`INSERT INTO public.credenciales (username, password_hash) VALUES ($1, $2) RETURNING id`, [`apr${i}`, hash]);
                const user = await qr.query(`INSERT INTO public.usuarios (id_persona, id_credencial, id_rol, estado) VALUES ($1, $2, $3, true) RETURNING id`, [pers[0].id, cred[0].id, rolAprId]);
                const cursoId = i === 1 ? cur1Id : cur2Id;
                await qr.query(`INSERT INTO public.matriculas (id_usuario, id_curso, estado) VALUES ($1, $2, true)`, [user[0].id, cursoId]);
            }
        }

        await qr.commitTransaction();
        console.log('--- Datos de prueba inyectados correctamente ---');
        return res.status(HttpStatus.OK).json({ success: true, message: 'Datos inyectados (Instructores, Aprendices, Fichas, etc)' });
      } catch (err) {
        await qr.rollbackTransaction();
        throw err;
      } finally {
        await qr.release();
      }
    } catch (error) {
      console.error('[Seed Datos] Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ success: false, error: String(error) });
    }
  }

  @Post('admin')
  async runSeed(@Res() res: any) {
    try {
      console.log('--- Ejecutando Endpoint Seed de Administrador y Roles ---');

      // 1. Roles
      const rolesToCreate = ['Administrador', 'Instructor', 'Aprendiz'];
      for (const rName of rolesToCreate) {
        let rol = await this.rolRepo.findOne({ where: { nombre: rName } });
        if (!rol) {
          rol = this.rolRepo.create({ nombre: rName, descripcion: `Rol del Sistema: ${rName}` });
          await this.rolRepo.save(rol);
          console.log(`[Seed] Rol creado: ${rName}`);
        } else {
          console.log(`[Seed] Rol pre-existente: ${rName}`);
        }
      }

      const rAdmin = await this.rolRepo.findOne({ where: { nombre: 'Administrador' } });

      if(!rAdmin) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          success: false,
          error: "Fallo crítico al crear u obtener el Rol Administrador."
        });
      }

      // 2. Persona Base
      let adminPerson = await this.persRepo.findOne({ where: { numero_documento: '123456789' } });
      if (!adminPerson) {
        adminPerson = this.persRepo.create({
          nombre: 'Admin ChronoGest',
          tipo_documento: 'CC',
          numero_documento: '123456789',
          correo: 'admin@chronogest.com',
          estado: true,
        });
        adminPerson = await this.persRepo.save(adminPerson);
        console.log(`[Seed] Persona Creada: ${adminPerson.nombre}`);
      } else {
        console.log(`[Seed] Persona pre-existente encontrada: ${adminPerson.nombre}`);
      }

      // 3. Credenciales
      let adminCred = await this.credRepo.findOne({ where: { username: 'admin' } });
      if (!adminCred) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash('Admin123*', salt);

        adminCred = this.credRepo.create({
          username: 'admin',
          password_hash: password_hash,
        });

        adminCred = await this.credRepo.save(adminCred);
        console.log('[Seed] Credenciales [admin] creadas correctamente.');
      } else {
        console.log('[Seed] Credenciales [admin] pre-existentes.');
      }

      // 4. Usuario Final
      let adminUser = await this.usuRepo.findOne({
        where: { persona: { id: adminPerson.id } },
        relations: ['persona'],
      });

      if (!adminUser) {
        adminUser = this.usuRepo.create({
          persona: adminPerson,
          credencial: adminCred,
          rol: rAdmin,
          estado: true,
        });
        await this.usuRepo.save(adminUser);
        console.log('[Seed] Usuario Administrativo compilado correctamente.');
      } else {
        console.log('[Seed] Usuario Administrativo ya existe.');
      }

      console.log('--- Seed ejecutado exitosamente ---');
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Seed completado satisfactoriamente. Roles y Administrador Base han sido garantizados.',
        adminId: adminUser.id,
        defaultUsername: adminCred.username
      });
      
    } catch (error) {
      console.error('[Seed] Error:', error);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Error en la ejecución del seed de administrador',
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}
