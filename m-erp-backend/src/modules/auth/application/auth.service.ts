import { Injectable, UnauthorizedException, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

import { Usuario } from '../../erp-users/domain/usuario.entity';
import { Credencial } from '../../erp-users/domain/credencial.entity';
import { Acceso } from '../../erp-users/domain/acceso.entity';
import { Aplicativo } from '../../erp-users/domain/aplicativo.entity';
import { Tenant } from '../../erp-centers/domain/entities/tenant.entity';
import { LoginDto } from '../infrastructure/controllers/dtos/login.dto';
import { JwtPayload } from '../domain/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private transporter: nodemailer.Transporter;

  constructor(
    @InjectRepository(Usuario) private usuarioRepo: Repository<Usuario>,
    @InjectRepository(Credencial) private credencialRepo: Repository<Credencial>,
    @InjectRepository(Acceso) private accesoRepo: Repository<Acceso>,
    @InjectRepository(Aplicativo) private aplicativoRepo: Repository<Aplicativo>,
    @InjectRepository(Tenant) private tenantRepo: Repository<Tenant>,
    private jwtService: JwtService,
  ) {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'localhost',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 1025,
      auth: process.env.SMTP_USER && process.env.SMTP_PASS ? {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      } : undefined,
    });
  }

  async login(loginDto: LoginDto, ip: string) {
    const credencial = await this.credencialRepo.findOne({ where: { username: loginDto.username } });
    if (!credencial) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, credencial.password_hash);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // fetch user with role bypassing RLS for login
    const queryRunner = this.usuarioRepo.manager.connection.createQueryRunner();
    await queryRunner.connect();
    
    let usuario;
    try {
      await queryRunner.query(`SET rls.is_superadmin = 'true'`);
      usuario = await queryRunner.manager.findOne(Usuario, {
        where: { credencial: { id: credencial.id } },
        relations: ['rol', 'persona'],
      });
    } finally {
      await queryRunner.query(`RESET rls.is_superadmin`);
      await queryRunner.release();
    }

    if (!usuario || !usuario.estado) {
      throw new UnauthorizedException('Usuario inactivo o no encontrado');
    }

    // register access
    const aplicativoNombre = loginDto.aplicativo_nombre || 'Principal';
    let aplicativo = await this.aplicativoRepo.findOne({ where: { nombre: aplicativoNombre } });
    if (!aplicativo) {
      // Create a default app if it doesn't exist just to register the access, or fail.
      aplicativo = this.aplicativoRepo.create({ nombre: aplicativoNombre, descripcion: 'Auto-created app context' });
      await this.aplicativoRepo.save(aplicativo);
    }

    const acceso = this.accesoRepo.create({
      usuario,
      aplicativo,
      ip,
    });
    await this.accesoRepo.save(acceso);

    // Update last access
    credencial.ultimo_acceso = new Date();
    await this.credencialRepo.save(credencial);

    const isSuperAdmin = usuario.rol?.nombre === 'superadmin';
    let codigoSede = null;
    
    if (!isSuperAdmin && usuario.sede_id) {
      const tenant = await this.tenantRepo.findOne({ where: { id: usuario.sede_id } });
      if (tenant) {
        codigoSede = tenant.codigo;
      }
    }

    const payload: any = { // Use any or update JwtPayload interface later if needed
      sub: usuario.id,
      username: credencial.username,
      role: usuario.rol?.nombre || 'Ninguno',
      userId: usuario.id,
      personaId: usuario.persona ? usuario.persona.id : '',
      
      // Multitenant payload updates
      persona_id: usuario.persona ? usuario.persona.id : '',
      rol: usuario.rol?.nombre || 'Ninguno',
      sede_id: codigoSede,
      isSuperAdmin: isSuperAdmin,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: usuario.id,
        username: credencial.username,
        role: usuario.rol?.nombre,
        nombre: usuario.persona ? usuario.persona.nombre : null,
      }
    };
  }

  async forgotPassword(email: string) {
    const credencial = await this.credencialRepo.findOne({ where: { username: email } });
    if (!credencial) {
      // To prevent email enumeration, we return success anyway.
      return { message: 'Si el correo existe, se enviará un enlace de recuperación.' };
    }

    const usuario = await this.usuarioRepo.findOne({ where: { credencial: { id: credencial.id } } });
    if (!usuario) {
      return { message: 'Si el correo existe, se enviará un enlace de recuperación.' };
    }

    // The secret is specific to this reset request: combination of current JWT_SECRET + current password hash
    const secret = process.env.JWT_SECRET + credencial.password_hash;
    const payload = { sub: usuario.id, email: credencial.username };
    const token = this.jwtService.sign(payload, { secret, expiresIn: '15m' });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';
    const resetLink = `${frontendUrl}/reset-password?token=${token}&email=${credencial.username}`;

    try {
      await this.transporter.sendMail({
        from: '"ChronoGest Soporte" <soporte@chronogest.sena.edu.co>',
        to: email,
        subject: 'Recuperación de Contraseña - ChronoGest',
        html: `<p>Hola,</p>
               <p>Has solicitado restablecer tu contraseña. Haz clic en el siguiente enlace y sigue las instrucciones:</p>
               <a href="${resetLink}">Restablecer Contraseña</a>
               <p>Este enlace expirará en 15 minutos.</p>
               <p>Si no solicitaste este cambio, puedes ignorar este correo.</p>`,
      });
    } catch (e) {
      console.error(e);
      throw new InternalServerErrorException('No se pudo enviar el correo de recuperación');
    }

    return { message: 'Si el correo existe, se enviará un enlace de recuperación.' };
  }

  async resetPassword(token: string, email: string, newPassword: string) {
    const credencial = await this.credencialRepo.findOne({ where: { username: email } });
    if (!credencial) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    const secret = process.env.JWT_SECRET + credencial.password_hash;
    
    try {
      this.jwtService.verify(token, { secret });
    } catch (e) {
      throw new BadRequestException('Token inválido o expirado.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    credencial.password_hash = await bcrypt.hash(newPassword, salt);
    await this.credencialRepo.save(credencial);

    return { message: 'Contraseña actualizada exitosamente.' };
  }

  async getMe(userId: string) {
    const usuario = await this.usuarioRepo.findOne({
      where: { id: userId },
      relations: ['rol', 'persona', 'credencial'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return {
      id: usuario.id,
      username: usuario.credencial?.username,
      estado: usuario.estado,
      role: usuario.rol?.nombre,
      persona: usuario.persona,
    };
  }
}
