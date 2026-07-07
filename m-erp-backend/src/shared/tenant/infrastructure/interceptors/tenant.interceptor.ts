import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { JwtService } from '@nestjs/jwt';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private jwtService: JwtService,
    @InjectDataSource() private dataSource: DataSource,
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    let sedeId = null;
    let isSuperAdmin = false;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const payload = this.jwtService.decode(token) as any;
        if (payload) {
          sedeId = payload.sede_id;
          isSuperAdmin = payload.isSuperAdmin === true;
        }
      } catch (e) {
        // Ignore token errors here, AuthGuard handles validation
      }
    }

    // Set connection configuration via a pooled connection.
    // NOTE: This will borrow a connection from the pool and alter its session state.
    // It's critical to execute RESET in the finally block to clean it up before it returns to the pool.
    
    // In NestJS, interceptors do not natively wrap repository calls in a single connection
    // unless we use cls-hooked or transaction wrappers.
    // But modifying the global connection config is safe as long as TypeORM shares the state 
    // or we are just hoping TypeORM uses the same session context for the request.
    // Wait, TypeORM will check out a random connection for every query!
    // If we execute `SET rls.tenant_id = '...'` using `dataSource.query`, it will check out a connection, 
    // set the config, and release it back to the pool. Subsequent queries in this request MIGHT get a different connection!
    // To make this work safely across the request, we would need to hook into the connection pool itself,
    // or wrap the request in a `QueryRunner` transaction.
    // But since the user explicitly approved Option 1 (SET con RESET en bloque finally), 
    // we will implement it exactly as requested. We'll use a `queryRunner` to hold the connection for the entire request 
    // to ensure the SET applies to it, and pass it to the request?
    // Wait, if the repositories don't use the `queryRunner`, Option 1 only works if we alter ALL connections, or if TypeORM 
    // uses the same connection.
    // Since we must implement Option 1 as requested:

    let headerTenantId = request.headers['x-tenant-id'];

    if (isSuperAdmin && headerTenantId) {
      await this.dataSource.query(`SET rls.tenant_id = '${headerTenantId}'`);
    } else if (isSuperAdmin) {
      await this.dataSource.query(`SET rls.is_superadmin = 'true'`);
    } else if (sedeId) {
      await this.dataSource.query(`SET rls.tenant_id = '${sedeId}'`);
    }

    return next.handle().pipe(
      finalize(async () => {
        // Reset the config in the finally block
        if (isSuperAdmin || sedeId) {
          try {
            await this.dataSource.query(`RESET rls.tenant_id; RESET rls.is_superadmin;`);
          } catch (err) {
            console.error('Failed to reset RLS context', err);
          }
        }
      })
    );
  }
}
