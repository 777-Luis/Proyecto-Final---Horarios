import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, from, firstValueFrom } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { runInTransaction } from 'typeorm-transactional';

// The whole request runs inside a single Postgres transaction (typeorm-transactional
// patches DataSource/Repository so every @InjectRepository() call in the app
// transparently joins it). `set_config(..., true)` sets rls.tenant_id/rls.is_superadmin
// as SET LOCAL, scoped to that one transaction and reset automatically on
// commit/rollback — so the same connection is used for the RLS setup and for
// every query the request makes, with no manual RESET and no leak through the pool.
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let sedeId: string | null = null;
    let isSuperAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload) {
          sedeId = payload.sede_id;
          isSuperAdmin = payload.isSuperAdmin === true;
        }
      } catch {
        // Ignore token errors here, AuthGuard handles validation
      }
    }

    const headerTenantId = request.headers['x-tenant-id'];

    return from(
      runInTransaction(async () => {
        if (isSuperAdmin && headerTenantId) {
          await this.dataSource.query(`SELECT set_config('rls.tenant_id', $1, true)`, [headerTenantId]);
          await this.dataSource.query(`SELECT set_config('rls.is_superadmin', 'true', true)`);
        } else if (isSuperAdmin) {
          await this.dataSource.query(`SELECT set_config('rls.is_superadmin', 'true', true)`);
        } else if (sedeId) {
          await this.dataSource.query(`SELECT set_config('rls.tenant_id', $1, true)`, [sedeId]);
        }

        return firstValueFrom(next.handle(), { defaultValue: undefined });
      }),
    );
  }
}
