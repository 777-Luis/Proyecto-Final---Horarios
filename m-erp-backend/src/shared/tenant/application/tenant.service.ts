import { Injectable } from '@nestjs/common';

@Injectable()
export class TenantService {
  // Service to handle tenant specific business logic or cache prefix generation for Fase 5
  generateCacheKey(tenantCode: string, resource: string): string {
    return `${tenantCode}:${resource}`;
  }
}
