import { Controller, Post, Body, Get, UseGuards, Req, Ip } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '../../application/auth.service';
import { LoginDto } from './dtos/login.dto';
import { ForgotPasswordDto } from './dtos/forgot-password.dto';
import { ResetPasswordDto } from './dtos/reset-password.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Ip() ip: string) {
    const finalIp = ip || 'unknown';
    return this.authService.login(loginDto, finalIp);
  }

  @Post('superadmin/login')
  async superadminLogin(@Body() dto: any, @Ip() ip: string) {
    const finalIp = ip || 'unknown';
    return this.authService.superadminLogin(dto, finalIp);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto.email);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.email,
      resetPasswordDto.new_password,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getMe(req.user.userId);
  }
  
  // Example of Role based endpoint
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // @Roles('Administrador')
  // @Get('admin-only')
  // ...
}
