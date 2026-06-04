import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RegistroClaseAction } from '../actions/registro-clase.action';
import { HorariosService } from '../horarios.service';

@Injectable()
export class RegistroClaseCronService implements OnModuleInit {
  private readonly logger = new Logger(RegistroClaseCronService.name);

  constructor(
    private readonly registroClaseAction: RegistroClaseAction,
    private readonly horariosService: HorariosService,
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando Auditoría de Arranque (Catch-up) para días anteriores...');
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().split('T')[0];
    
    // Ejecutamos limpieza para ayer en el arranque, por si el servidor estuvo apagado a la medianoche.
    await this.ejecutarLimpieza(fechaAyer);
  }

  // Ejecutar todos los días a las 11:59 PM (23:59)
  @Cron('59 23 * * *')
  async cierreAutomaticoDeJornada() {
    const hoy = new Date().toISOString().split('T')[0];
    this.logger.log(`Iniciando Cron Job: Cierre Automático de Jornada para ${hoy}`);
    await this.ejecutarLimpieza(hoy);
  }

  private async ejecutarLimpieza(fecha: string) {
    try {
      const fechaObj = new Date(fecha + 'T00:00:00');
      const diaSemanaJs = fechaObj.getDay();
      
      // Ajuste de días (nuestro sistema Domingo = 0, Lunes = 1... Sábado = 6)
      const diaSemanaMap: { [key: number]: number } = {
        1: 1, // Lunes
        2: 2, // Martes
        3: 3, // Miércoles
        4: 4, // Jueves
        5: 5, // Viernes
        6: 6, // Sábado
        0: 0, // Domingo
      };
      
      const diaSemanaSistema = diaSemanaMap[diaSemanaJs];

      const horariosProgramados = await this.horariosService.obtenerDetallesPorDia(diaSemanaSistema);
      
      await this.registroClaseAction.cerrarJornada(fecha, horariosProgramados);
      this.logger.log(`Limpieza completada exitosamente para la fecha ${fecha}`);
    } catch (error) {
      this.logger.error(`Error ejecutando la limpieza para la fecha ${fecha}`, error);
    }
  }
}
