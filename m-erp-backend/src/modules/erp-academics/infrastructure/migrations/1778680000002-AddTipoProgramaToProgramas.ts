import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTipoProgramaToProgramas1778680000002 implements MigrationInterface {
    name = 'AddTipoProgramaToProgramas1778680000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."programas_tipo_programa_enum" AS ENUM('Tecnólogo', 'Técnico', 'Curso')`);
        await queryRunner.query(`ALTER TABLE "programas" ADD "tipo_programa" "public"."programas_tipo_programa_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "programas" DROP COLUMN "tipo_programa"`);
        await queryRunner.query(`DROP TYPE "public"."programas_tipo_programa_enum"`);
    }
}
