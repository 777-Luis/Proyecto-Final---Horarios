import { MigrationInterface, QueryRunner } from "typeorm";

export class EnableRLS1783395412032 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            "usuarios", "personas", "ambientes", "cursos", 
            "horarios", "horario_detalle", "areas", 
            "programas", "solicitudes_cambio", "registro_clases", 
            "notificaciones", "matriculas"
        ];

        for (const table of tables) {
            // Enable RLS
            await queryRunner.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

            // Drop existing policy if any
            await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);

            // Create the isolation policy
            await queryRunner.query(`
                CREATE POLICY tenant_isolation_policy 
                ON ${table}
                FOR ALL
                USING (
                    sede_id = (
                        SELECT id FROM tenants 
                        WHERE codigo = current_setting('rls.tenant_id', true)
                    )
                    OR current_setting('rls.is_superadmin', true) = 'true'
                )
                WITH CHECK (
                    sede_id = (
                        SELECT id FROM tenants 
                        WHERE codigo = current_setting('rls.tenant_id', true)
                    )
                    OR current_setting('rls.is_superadmin', true) = 'true'
                );
            `);
            
            
            // Note: Postgres owner bypasses RLS by default. If the app connects using the owner, 
            // RLS won't apply unless we FORCE ROW LEVEL SECURITY. But it's usually better to run the app as a non-superuser.
            // For safety and testing locally, we'll FORCE it so it applies even to table owners.
            await queryRunner.query(`ALTER TABLE ${table} FORCE ROW LEVEL SECURITY;`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            "usuarios", "personas", "ambientes", "cursos", 
            "horarios", "horario_detalle", "areas", 
            "programas", "solicitudes_cambio", "registro_clases", 
            "notificaciones", "matriculas"
        ];

        for (const table of tables) {
            await queryRunner.query(`ALTER TABLE ${table} NO FORCE ROW LEVEL SECURITY;`);
            await queryRunner.query(`DROP POLICY IF EXISTS tenant_isolation_policy ON ${table};`);
            await queryRunner.query(`ALTER TABLE ${table} DISABLE ROW LEVEL SECURITY;`);
        }
    }
}
