import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCursos1778680000003 implements MigrationInterface {
    name = 'UpdateCursos1778680000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cursos" ADD "fecha_inicio" date`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD "fecha_fin" date`);
        await queryRunner.query(`CREATE TYPE "public"."cursos_estado_enum" AS ENUM('Activo', 'Inactivo')`);
        await queryRunner.query(`ALTER TABLE "cursos" ADD "estado" "public"."cursos_estado_enum" NOT NULL DEFAULT 'Activo'`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "nivel_formacion"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cursos" ADD "nivel_formacion" character varying(50) NOT NULL DEFAULT 'Técnico'`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "estado"`);
        await queryRunner.query(`DROP TYPE "public"."cursos_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "fecha_fin"`);
        await queryRunner.query(`ALTER TABLE "cursos" DROP COLUMN "fecha_inicio"`);
    }
}
