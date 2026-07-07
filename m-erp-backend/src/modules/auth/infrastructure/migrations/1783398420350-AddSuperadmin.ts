import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSuperadmin1783398420350 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Bypass RLS for seeding
        await queryRunner.query(`SET rls.is_superadmin = 'true'`);

        // Add codigo_acceso to credenciales
        await queryRunner.query(`ALTER TABLE "credenciales" ADD "codigo_acceso" character varying(255)`);

        // Insert rol superadmin
        const [rol] = await queryRunner.query(`
            INSERT INTO "roles" (nombre, descripcion)
            VALUES ('superadmin', 'Rol del Sistema: Super Administrador')
            RETURNING id
        `);

        // Insert credencial
        const [credencial] = await queryRunner.query(`
            INSERT INTO "credenciales" (username, password_hash, codigo_acceso)
            VALUES ('superadmin', '$2b$10$Yhq/5QNID1.H0aoydSZhnuq58YMos5zC7GkVSw3sBjNrHztNi0D9y', '$2b$10$TGMcZowH31HcKnIXR.y2DOQwSDW6JtSTBLEp3qdwIAnLbcqkIZ4Oa')
            RETURNING id
        `);

        // Insert persona (sede_id = null)
        const [persona] = await queryRunner.query(`
            INSERT INTO "personas" (nombre, apellido, tipo_documento, numero_documento, correo, estado)
            VALUES ('Super', 'Administrador', 'CC', '0000000000', 'superadmin@chronogest.com', true)
            RETURNING id
        `);

        // Insert usuario
        await queryRunner.query(`
            INSERT INTO "usuarios" (estado, persona_id, credencial_id, rol_id)
            VALUES (true, '${persona.id}', '${credencial.id}', '${rol.id}')
        `);

        // Reset RLS
        await queryRunner.query(`RESET rls.is_superadmin`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`SET rls.is_superadmin = 'true'`);
        
        // Delete usuario
        await queryRunner.query(`DELETE FROM "usuarios" WHERE credencial_id IN (SELECT id FROM "credenciales" WHERE username = 'superadmin')`);
        
        // Delete persona
        await queryRunner.query(`DELETE FROM "personas" WHERE correo = 'superadmin@chronogest.com'`);

        // Delete credencial
        await queryRunner.query(`DELETE FROM "credenciales" WHERE username = 'superadmin'`);

        // Delete rol
        await queryRunner.query(`DELETE FROM "roles" WHERE nombre = 'superadmin'`);

        // Drop column
        await queryRunner.query(`ALTER TABLE "credenciales" DROP COLUMN "codigo_acceso"`);
    }

}
