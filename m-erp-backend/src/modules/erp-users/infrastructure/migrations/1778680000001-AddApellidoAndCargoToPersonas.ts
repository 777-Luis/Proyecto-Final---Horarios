import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApellidoAndCargoToPersonas1778680000001 implements MigrationInterface {
    name = 'AddApellidoAndCargoToPersonas1778680000001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personas" ADD "apellido" character varying(150)`);
        await queryRunner.query(`CREATE TYPE "public"."personas_cargo_enum" AS ENUM('Aprendiz', 'Instructor', 'Administrador')`);
        await queryRunner.query(`ALTER TABLE "personas" ADD "cargo" "public"."personas_cargo_enum"`);
        
        // Poblar cargo en usuarios existentes
        await queryRunner.query(`
            UPDATE personas
            SET cargo = r.nombre::public.personas_cargo_enum
            FROM usuarios u
            JOIN roles r ON u.rol_id = r.id
            WHERE u.persona_id = personas.id;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "cargo"`);
        await queryRunner.query(`DROP TYPE "public"."personas_cargo_enum"`);
        await queryRunner.query(`ALTER TABLE "personas" DROP COLUMN "apellido"`);
    }
}
