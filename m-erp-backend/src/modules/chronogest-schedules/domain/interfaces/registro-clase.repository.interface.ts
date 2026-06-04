import { RegistroClase } from '../entities/registro-clase.entity';

export interface IRegistroClaseRepository {
  crear(registro: Partial<RegistroClase>): Promise<RegistroClase>;
  actualizar(id: string, registro: Partial<RegistroClase>): Promise<RegistroClase | null>;
  obtenerPorId(id: string): Promise<RegistroClase | null>;
  obtenerPorHorarioDetalleYFecha(horarioDetalleId: string, fecha: string): Promise<RegistroClase | null>;
  obtenerPorFecha(fecha: string): Promise<RegistroClase[]>;
  obtenerPorRangoFechas(fechaInicio: string, fechaFin: string): Promise<RegistroClase[]>;
  obtenerPorInstructorYFecha(instructorId: string, fecha: string): Promise<RegistroClase[]>;
  obtenerPorInstructorYRango(instructorId: string, fechaInicio: string, fechaFin: string): Promise<RegistroClase[]>;
  obtenerAmbientesDisponibles(fecha: string, jornada?: string): Promise<any[]>;
  actualizarMasivo(criterio: any, valores: Partial<RegistroClase>): Promise<void>;
  crearMasivo(registros: Partial<RegistroClase>[]): Promise<void>;
}
