import { Injectable, CanActivate, ForbiddenException } from '@nestjs/common';

// Blocks a route entirely when NODE_ENV=production. Used on dev/seed-only
// endpoints that have no business being reachable on a real deployment.
@Injectable()
export class NotInProductionGuard implements CanActivate {
  canActivate(): boolean {
    if (process.env.NODE_ENV === 'production') {
      throw new ForbiddenException('Este endpoint no esta disponible en producción.');
    }
    return true;
  }
}
