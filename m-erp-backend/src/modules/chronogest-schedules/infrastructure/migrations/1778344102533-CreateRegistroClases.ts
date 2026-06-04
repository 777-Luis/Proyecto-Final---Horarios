import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateRegistroClases1778344102533 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(new Table({
            name: "registro_clases",
            columns: [
                {
                    name: "id",
                    type: "uuid",
                    isPrimary: true,
                    generationStrategy: "uuid",
                    default: "uuid_generate_v4()",
                },
                {
                    name: "horario_detalle_id",
                    type: "uuid",
                },
                {
                    name: "instructor_id",
                    type: "uuid",
                },
                {
                    name: "fecha",
                    type: "date",
                },
                {
                    name: "hora_activacion",
                    type: "timestamp",
                    isNullable: true,
                },
                {
                    name: "estado",
                    type: "varchar", // Enums in postgres can be varchar in migrations or proper enums. We use varchar for simplicity.
                    default: "'pendiente'",
                },
                {
                    name: "minutos_retraso",
                    type: "int",
                    isNullable: true,
                },
                {
                    name: "ambiente_id",
                    type: "uuid",
                    isNullable: true,
                },
                {
                    name: "es_transversal",
                    type: "boolean",
                    default: false,
                },
                {
                    name: "created_at",
                    type: "timestamp",
                    default: "now()",
                },
                {
                    name: "updated_at",
                    type: "timestamp",
                    default: "now()",
                }
            ]
        }), true);

        await queryRunner.createForeignKey("registro_clases", new TableForeignKey({
            columnNames: ["horario_detalle_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "horario_detalle",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("registro_clases", new TableForeignKey({
            columnNames: ["instructor_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "personas",
            onDelete: "CASCADE"
        }));

        await queryRunner.createForeignKey("registro_clases", new TableForeignKey({
            columnNames: ["ambiente_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "ambientes",
            onDelete: "SET NULL"
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("registro_clases");
    }

}
