import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNoAsistioEnum1779752060570 implements MigrationInterface {
    name = 'AddNoAsistioEnum1779752060570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "fk_area_id_fk"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_8adb93c653d374ae2d3dadd0ae6"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_4365f8ee9976ab25d80925e8005"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_45e73a9ea11275447445b8ec606"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "fk_ambiente"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "fk_instructor"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "fk_horario_detalle"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP COLUMN "estado"`);
        await queryRunner.query(`CREATE TYPE "public"."registro_clases_estado_enum" AS ENUM('pendiente', 'activa', 'finalizada', 'suspendida', 'no_asistio')`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD "estado" "public"."registro_clases_estado_enum" NOT NULL DEFAULT 'pendiente'`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "es_transversal" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "suspension_aprobada" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "FK_c315a7cc1b42e4335f755001b9d" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_45e73a9ea11275447445b8ec606" FOREIGN KEY ("horario_detalle_id") REFERENCES "horario_detalle"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_4365f8ee9976ab25d80925e8005" FOREIGN KEY ("instructor_id") REFERENCES "personas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_8adb93c653d374ae2d3dadd0ae6" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_8adb93c653d374ae2d3dadd0ae6"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_4365f8ee9976ab25d80925e8005"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP CONSTRAINT "FK_45e73a9ea11275447445b8ec606"`);
        await queryRunner.query(`ALTER TABLE "usuarios" DROP CONSTRAINT "FK_c315a7cc1b42e4335f755001b9d"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "suspension_aprobada" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ALTER COLUMN "es_transversal" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "registro_clases" DROP COLUMN "estado"`);
        await queryRunner.query(`DROP TYPE "public"."registro_clases_estado_enum"`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD "estado" character varying DEFAULT 'pendiente'`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "fk_horario_detalle" FOREIGN KEY ("horario_detalle_id") REFERENCES "horario_detalle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "fk_instructor" FOREIGN KEY ("instructor_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "fk_ambiente" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_45e73a9ea11275447445b8ec606" FOREIGN KEY ("horario_detalle_id") REFERENCES "horario_detalle"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_4365f8ee9976ab25d80925e8005" FOREIGN KEY ("instructor_id") REFERENCES "personas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registro_clases" ADD CONSTRAINT "FK_8adb93c653d374ae2d3dadd0ae6" FOREIGN KEY ("ambiente_id") REFERENCES "ambientes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "usuarios" ADD CONSTRAINT "fk_area_id_fk" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
