import { MigrationInterface, QueryRunner } from "typeorm";

export class SetNullHorarioDetalle1779804368495 implements MigrationInterface {
    name = 'SetNullHorarioDetalle1779804368495'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_45e73a9ea11275447445b8ec606"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "horario_detalle_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_45e73a9ea11275447445b8ec606" FOREIGN KEY ("horario_detalle_id") REFERENCES "horario_detalle"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_45e73a9ea11275447445b8ec606"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "horario_detalle_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_45e73a9ea11275447445b8ec606" FOREIGN KEY ("horario_detalle_id") REFERENCES "horario_detalle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
