import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompetenciasToHorarioDetalle1779945528960 implements MigrationInterface {
    name = 'AddCompetenciasToHorarioDetalle1779945528960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "horario_detalle" ADD "competencia" text`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" ADD "resultado" text`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" ADD "fecha_inicio_competencia" date`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" ADD "fecha_fin_competencia" date`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "horario_detalle" DROP COLUMN "fecha_fin_competencia"`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" DROP COLUMN "fecha_inicio_competencia"`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" DROP COLUMN "resultado"`);
        await queryRunner.query(`ALTER TABLE "horario_detalle" DROP COLUMN "competencia"`);
    }

}
