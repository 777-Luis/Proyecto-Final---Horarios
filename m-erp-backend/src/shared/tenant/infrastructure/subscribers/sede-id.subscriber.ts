import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntitySubscriberInterface, EventSubscriber, InsertEvent } from 'typeorm';

// Auto-fills sede_id on insert for any entity that has that column, using the
// tenant already set for this request/transaction by TenantInterceptor
// (rls.tenant_id). Entities that already come with sede_id explicitly set
// (e.g. superadmin picking a target sede) are left untouched.
@Injectable()
@EventSubscriber()
export class SedeIdSubscriber implements EntitySubscriberInterface {
  constructor(@InjectDataSource() dataSource: DataSource) {
    dataSource.subscribers.push(this);
  }

  async beforeInsert(event: InsertEvent<any>): Promise<void> {
    if (!event.metadata.hasColumnWithPropertyPath('sede_id')) return;
    if (event.entity?.sede_id) return;

    const rows = await event.manager.query(
      `SELECT id FROM tenants WHERE codigo = current_setting('rls.tenant_id', true)`,
    );
    if (rows?.[0]?.id) {
      event.entity.sede_id = rows[0].id;
    }
  }
}
