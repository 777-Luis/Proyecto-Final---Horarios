import { Controller, Post, UseGuards } from '@nestjs/common';
import { AcademicsSeedService } from '../../application/academics-seed.service';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { RolesGuard } from '../../../auth/infrastructure/guards/roles.guard';
import { Roles } from '../../../auth/infrastructure/decorators/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('academics-seed')
export class AcademicsSeedController {
  constructor(private readonly seedService: AcademicsSeedService) {}

  @Roles('Administrador')
  @Post()
  async runSeed() {
    return this.seedService.seedYamboro();
  }
}
