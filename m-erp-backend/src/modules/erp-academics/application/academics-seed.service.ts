import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Sede } from '../../erp-centers/domain/sede.entity';
import { Area } from '../../erp-centers/domain/area.entity';
import { Programa } from '../domain/programa.entity';
import { CentroFormacion } from '../../erp-centers/domain/centro-formacion.entity';

@Injectable()
export class AcademicsSeedService {
  private readonly logger = new Logger(AcademicsSeedService.name);

  constructor(
    @InjectRepository(CentroFormacion) private centroRepo: Repository<CentroFormacion>,
    @InjectRepository(Sede) private sedeRepo: Repository<Sede>,
    @InjectRepository(Area) private areaRepo: Repository<Area>,
    @InjectRepository(Programa) private programaRepo: Repository<Programa>,
  ) {}

  async seedYamboro() {
    // 1. Ensure Centro and Sede exist
    let centro = await this.centroRepo.findOne({ where: { nombre: 'SENA Agroempresarial' } });
    if (!centro) {
      centro = this.centroRepo.create({ nombre: 'SENA Agroempresarial' });
      await this.centroRepo.save(centro);
    }

    let sede = await this.sedeRepo.findOne({ where: { nombre: 'Yamboro' } });
    if (!sede) {
      sede = this.sedeRepo.create({ nombre: 'Yamboro', centro_formacion: centro });
      await this.sedeRepo.save(sede);
    }

    // Define seed structure
    const areasSeed = [
      {
        nombre: 'TIC',
        programas: ['Análisis y Desarrollo de Software', 'Producción de Multimedia', 'Gestión de Redes de Datos'],
      },
      {
        nombre: 'Agropecuario',
        programas: ['PAE', 'GEA', 'Producción Pecuaria', 'Gestión Agro Empresarial', 'Promotoria Campesina en Agroecología'],
      },
      {
        nombre: 'Turismo',
        programas: ['Cocina', 'Deportes', 'Barismo'],
      },
      {
        nombre: 'Ambiental',
        programas: ['Gestión de Recursos Naturales', 'Prevención y Control Ambiental'],
      },
      {
        nombre: 'Construcción',
        programas: ['Construcción de Infraestructura Vial', 'Dibujo y Modelado Arquitectónico y de Ingeniería', 'Construcción en Edificaciones', 'Eléctricos'],
      }
    ];

    let insertedAreas = 0;
    let insertedProgramas = 0;

    for (const areaData of areasSeed) {
      let area = await this.areaRepo.findOne({ where: { nombre: areaData.nombre, sede: { id: sede.id } } });
      if (!area) {
        area = this.areaRepo.create({ nombre: areaData.nombre, sede });
        await this.areaRepo.save(area);
        insertedAreas++;
      }

      for (const progName of areaData.programas) {
        const programaExists = await this.programaRepo.findOne({ where: { nombre: progName, area: { id: area.id } } });
        if (!programaExists) {
          const programa = this.programaRepo.create({ nombre: progName, area });
          await this.programaRepo.save(programa);
          insertedProgramas++;
        }
      }
    }

    this.logger.log(`Seed completed: ${insertedAreas} areas and ${insertedProgramas} programas inserted.`);
    return { message: `Carga de áreas y programas completada. Áreas nuevas: ${insertedAreas}. Programas nuevos: ${insertedProgramas}.` };
  }
}
