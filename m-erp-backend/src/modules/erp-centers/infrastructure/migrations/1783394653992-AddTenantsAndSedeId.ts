import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey } from "typeorm";

export class AddTenantsAndSedeId1783394653992 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create tenants table
        await queryRunner.createTable(new Table({
            name: "tenants",
            columns: [
                { name: "id", type: "uuid", isPrimary: true, isGenerated: true, generationStrategy: "uuid" },
                { name: "nombre", type: "varchar", length: "200", isNullable: false },
                { name: "codigo", type: "varchar", length: "50", isUnique: true, isNullable: false },
                { name: "direccion", type: "text", isNullable: true },
                { name: "telefono", type: "varchar", length: "20", isNullable: true },
                { name: "activo", type: "boolean", default: true },
                { name: "created_at", type: "timestamp", default: "now()" }
            ]
        }), true);

        // 2. Insert initial tenants
        await queryRunner.query(`
            INSERT INTO tenants (nombre, codigo) VALUES 
            ('Tecnoparque Agroecológico Yamboró', 'yamboro'),
            ('SENA Pitalito', 'pitalito'),
            ('SENA Neiva', 'neiva')
        `);

        // 3. Add sede_id to tables and populate
        const tables = [
            "usuarios", "personas", "ambientes", "cursos", 
            "horarios", "horario_detalle", "areas", 
            "programas", "solicitudes_cambio", "registro_clases", 
            "notificaciones", "matriculas"
        ];

        for (const tableName of tables) {
            const table = await queryRunner.getTable(tableName);
            let hasColumn = false;
            
            if (table) {
                const column = table.columns.find(c => c.name === "sede_id");
                if (column) {
                    hasColumn = true;
                    const fks = table.foreignKeys.filter(fk => fk.columnNames.includes("sede_id"));
                    for (const fk of fks) {
                        await queryRunner.dropForeignKey(tableName, fk);
                    }
                    await queryRunner.query(`UPDATE ${tableName} SET sede_id = NULL`);
                }
            }

            if (!hasColumn) {
                await queryRunner.addColumn(tableName, new TableColumn({
                    name: "sede_id",
                    type: "uuid",
                    isNullable: true
                }));
            }

            // 4. Populate with yamboro
            await queryRunner.query(`
                UPDATE ${tableName} 
                SET sede_id = (SELECT id FROM tenants WHERE codigo = 'yamboro') 
                WHERE sede_id IS NULL
            `);

            await queryRunner.createForeignKey(tableName, new TableForeignKey({
                columnNames: ["sede_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "tenants",
                onDelete: "SET NULL"
            }));
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const tables = [
            "usuarios", "personas", "ambientes", "cursos", 
            "horarios", "horario_detalle", "areas", 
            "programas", "solicitudes_cambio", "registro_clases", 
            "notificaciones", "matriculas"
        ];

        for (const tableName of tables) {
            const table = await queryRunner.getTable(tableName);
            if (table) {
                const foreignKey = table.foreignKeys.find(fk => fk.columnNames.indexOf("sede_id") !== -1);
                if (foreignKey) {
                    await queryRunner.dropForeignKey(tableName, foreignKey);
                }
                await queryRunner.dropColumn(tableName, "sede_id");
            }
        }

        await queryRunner.dropTable("tenants");
    }
}
