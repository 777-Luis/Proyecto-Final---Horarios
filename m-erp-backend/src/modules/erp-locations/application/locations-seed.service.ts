import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Departamento } from '../domain/departamento.entity';
import { Municipio } from '../domain/municipio.entity';

@Injectable()
export class LocationsSeedService {
  private readonly logger = new Logger(LocationsSeedService.name);

  constructor(
    @InjectRepository(Departamento) private depRepo: Repository<Departamento>,
    @InjectRepository(Municipio) private munRepo: Repository<Municipio>,
  ) {}

  async seedHuila(): Promise<{ message: string }> {
    // Check if Huila already exists
    let huila = await this.depRepo.findOne({ where: { nombre: 'Huila' } });
    
    if (!huila) {
      huila = this.depRepo.create({ nombre: 'Huila' });
      await this.depRepo.save(huila);
      this.logger.log('Departamento Huila created');
    }

    const muns = [
      'Pitalito', 'Neiva', 'Garzón', 'La Plata', 'Aipe', 
      'Algeciras', 'Altamira', 'Baraya', 'Campoalegre', 'Colombia',
      'Elías', 'Agrado', 'Gigante', 'Guadalupe', 'Hobo', 'Íquira', 
      'Isnos', 'La Argentina', 'Nátaga', 'Oporapa', 'Paicol', 
      'Palermo', 'Palestina', 'Rivera', 'Saladoblanco', 'San Agustín',
      'Santa María', 'Suaza', 'Tarqui', 'Tesalia', 'Tello', 'Teruel', 
      'Timaná', 'Villavieja', 'Yaguará'
    ];

    let insertedCount = 0;
    for (const nombre of muns) {
      const exists = await this.munRepo.findOne({ where: { nombre, departamento: { id: huila.id } } });
      if (!exists) {
        const municipio = this.munRepo.create({ nombre, departamento: huila });
        await this.munRepo.save(municipio);
        insertedCount++;
      }
    }

    this.logger.log(`Inserted ${insertedCount} municipios for Huila`);
    return { message: `Seed completed. Inserted ${insertedCount} new municipios for Huila.` };
  }
}
