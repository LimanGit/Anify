/**
 * @fileoverview Database handler implementation.
 */

import { Pool, Client, type ClientConfig, type PoolConfig } from "pg";
import type { IColumnDefinition, ITableSchemaDefinition, ITableSchemas } from "../../../types/impl/database";
import { emitter } from "../../../events";
import { Events } from "../../../types/impl/events";
import { normalizeDefaultValue } from "../../../helper/impl/json";
import { normalizeDBColumnType, normalizeSchemaColumnType } from "../../../helper/impl/database";
import { LRUCache as LRU } from "lru-cache";

/**
 * @class DatabaseHandler
 */
export default class DatabaseHandler {
    /**
     * @description PostgreSQL connection pool.
     */
    private pool: Pool;

    /**
     * @description PostgreSQL client for transactions.
     */
    private client: Client;

    /**
     * @description Table schemas to sync with the database.
     */
    private schemas: ITableSchemas;

    /**
     * @description Query cache using LRU.
     */
    private queryCache: LRU<string, any>;

    /**
     * @description Map of prepared statements.
     */
    private preparedStatements: Map<string, { text: string; values: any[] }> = new Map();

    /**
     * @description Whether the database is connected.
     */
    private isConnected: boolean = false;

    /**
     * @constructor Creates a new DatabaseHandler instance.
     *
     * @param config PostgreSQL client configuration.
     * @param schemas Table schemas to sync with the database.
     */
    constructor(config: ClientConfig, schemas: ITableSchemas) {
        // Convert ClientConfig to PoolConfig and add pool-specific settings
        const poolConfig: PoolConfig = {
            ...config,
            max: 20, // Maximum number of clients in the pool
            idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
            connectionTimeoutMillis: 2000, // How long to wait for a connection
        };

        this.pool = new Pool(poolConfig);
        this.client = new Client(config);
        this.schemas = schemas;

        // Initialize query cache with a max of 1000 items and 5 minute TTL
        this.queryCache = new LRU({
            max: 1000,
            ttl: 1000 * 60 * 5,
        });

        // Handle pool errors
        this.pool.on("error", (err) => {
            console.error("Unexpected error on idle client", err);
        });
    }

    /**
     * @method connect Connects to the PostgreSQL database.
     */
    public async connect(): Promise<void> {
        if (this.isConnected) {
            return;
        }

        try {
            await this.client.connect();
            await this.ensureExtensionsAndFunctions();
            await this.prepareCommonStatements();
            this.isConnected = true;
            await emitter.emitAsync(Events.DATABASE_CONNECTED);
        } catch (error) {
            this.isConnected = false;
            throw error;
        }
    }

    /**
     * @method disconnect Disconnects from the PostgreSQL database.
     */
    public async disconnect(): Promise<void> {
        if (!this.isConnected) {
            return;
        }

        await this.client.end();
        await this.pool.end();
        this.isConnected = false;
        await emitter.emitAsync(Events.DATABASE_DISCONNECTED);
    }

    /**
     * @method prepareCommonStatements Prepares commonly used SQL statements.
     */
    private async prepareCommonStatements(): Promise<void> {
        // Prepare common SELECT statements for each table
        for (const tableName of Object.keys(this.schemas)) {
            const selectStmt = {
                text: `SELECT * FROM "${tableName}" WHERE id = $1`,
                values: [],
            };
            this.preparedStatements.set(`select_${tableName}`, selectStmt);

            const deleteStmt = {
                text: `DELETE FROM "${tableName}" WHERE id = $1`,
                values: [],
            };
            this.preparedStatements.set(`delete_${tableName}`, deleteStmt);
        }
    }

    /**
     * @method beginTransaction Starts a new transaction.
     */
    public async beginTransaction(): Promise<void> {
        await this.client.query("BEGIN");
    }

    /**
     * @method commitTransaction Commits the current transaction.
     */
    public async commitTransaction(): Promise<void> {
        await this.client.query("COMMIT");
    }

    /**
     * @method rollbackTransaction Rolls back the current transaction.
     */
    public async rollbackTransaction(): Promise<void> {
        await this.client.query("ROLLBACK");
    }

    /**
     * @method withTransaction Executes a callback within a transaction.
     */
    public async withTransaction<T>(callback: () => Promise<T>): Promise<T> {
        try {
            await this.beginTransaction();
            const result = await callback();
            await this.commitTransaction();
            return result;
        } catch (error) {
            await this.rollbackTransaction();
            throw error;
        }
    }

    /**
     * @method query Executes a query using the connection pool.
     */
    public async query(sql: string, values: any[] = [], useCache: boolean = false): Promise<any> {
        const cacheKey = useCache ? `${sql}-${JSON.stringify(values)}` : null;

        if (cacheKey && this.queryCache.has(cacheKey)) {
            return this.queryCache.get(cacheKey);
        }

        const client = await this.pool.connect();
        try {
            const result = await client.query(sql, values);

            if (cacheKey) {
                this.queryCache.set(cacheKey, result);
            }

            return result;
        } finally {
            client.release();
        }
    }

    /**
     * @method batchQuery Executes multiple queries in a single transaction.
     */
    public async batchQuery(queries: { sql: string; values: any[] }[]): Promise<any[]> {
        return this.withTransaction(async () => {
            const results = [];
            for (const query of queries) {
                const result = await this.query(query.sql, query.values);
                results.push(result);
            }
            return results;
        });
    }

    /**
     * @method ensureExtensionsAndFunctions Ensures that required extensions and functions are installed.
     */
    private async ensureExtensionsAndFunctions(): Promise<void> {
        // Ensure pg_trgm extension
        await this.client.query(`CREATE EXTENSION IF NOT EXISTS "pg_trgm";`);

        // Ensure most_similar function
        // We can either create it unconditionally (CREATE OR REPLACE) or check if it exists.
        // CREATE OR REPLACE is generally safe if we want a specific definition.
        // This function is mainly for searching and also requires the pg_trgm extension.
        await this.client.query(`
            CREATE OR REPLACE FUNCTION most_similar(text, text[]) 
            RETURNS double precision
            LANGUAGE sql AS $$
                SELECT max(similarity($1, x)) FROM unnest($2) f(x)
            $$;
        `);
    }

    /**
     * @method syncSchema Ensures that the database schema matches the defined schema.
     */
    public async syncSchema(): Promise<void> {
        // Loop through each table schema and create or sync the table
        for (const tableName of Object.keys(this.schemas)) {
            const schema = this.schemas[tableName];
            const exists = await this.tableExists(tableName);
            if (!exists) {
                await this.createTable(schema);
            } else {
                await this.syncTableSchema(schema);
            }
        }

        await emitter.emitAsync(Events.DATABASE_SCHEMA_SYNCED);
    }

    /**
     * @method tableExists Checks if a table exists in the database.
     *
     * @param tableName The name of the table to check.
     * @returns Promise<boolean>
     */
    private async tableExists(tableName: string): Promise<boolean> {
        const res = await this.client.query(
            `SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = $1
            ) AS "exists";`,
            [tableName],
        );
        return Boolean(res.rows[0]?.exists);
    }

    /**
     * @method generateColumnDefinition Generates a column definition string.
     *
     * @param column Custom column JSON definition.
     * @returns string
     */
    private generateColumnDefinition(column: IColumnDefinition): string {
        let def = `"${column.name}" ${column.type}`;
        if (!column.nullable) {
            def += " NOT NULL";
        }
        if (column.primaryKey) {
            def += " PRIMARY KEY";
        }
        if (column.unique) {
            def += " UNIQUE";
        }
        if (column.defaultValue !== undefined && column.defaultValue !== null) {
            // Detect if defaultValue is a function call or a cast expression
            const defaultVal = column.defaultValue;
            if (typeof defaultVal === "string") {
                const isFunctionCall = defaultVal.endsWith("()");
                const isCastExpression = defaultVal.includes("::");
                // If it's a function call or a cast expression, use as-is
                if (isFunctionCall || isCastExpression) {
                    def += ` DEFAULT ${defaultVal}`;
                } else {
                    // Else treat it as a normal string literal
                    def += ` DEFAULT '${defaultVal}'`;
                }
            } else {
                // For numeric, boolean, or other non-string literals
                def += ` DEFAULT ${defaultVal}`;
            }
        }
        return def;
    }

    /**
     * @method createTable Creates a new table in the database.
     *
     * @param schema Table schema definition.
     */
    private async createTable(schema: ITableSchemaDefinition): Promise<void> {
        try {
            const columnDefs = schema.columns.map((c) => this.generateColumnDefinition(c)).join(", ");
            let createSQL = `CREATE TABLE "${schema.name}" (${columnDefs}`;

            // Add references if any
            for (const col of schema.columns) {
                if (col.references) {
                    createSQL += `, FOREIGN KEY ("${col.name}") REFERENCES "${col.references.table}"("${col.references.column}")`;
                }
            }

            createSQL += ");";
            await this.client.query(createSQL);

            await emitter.emitAsync(Events.DATABASE_TABLE_CREATED, schema.name);
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to create table "${schema.name}".`);
        }
    }

    /**
     * @method syncTableSchema Syncs an existing table with the defined schema.
     *
     * @description Syncs an existing table with the defined schema:
     * - Checks for missing columns and adds them.
     * - Checks for changed defaults and updates them only if they differ when compared in a case-insensitive manner.
     *   If the lowercase representations match, do not sync.
     * - Checks if the `nullable` setting has changed and updates accordingly.
     * - Does not drop extra columns in this basic example (can be extended).
     *
     * @param schema Table schema definition.
     */
    private async syncTableSchema(schema: ITableSchemaDefinition): Promise<void> {
        const dbColumns = await this.getTableColumns(schema.name);

        for (const col of schema.columns) {
            const dbCol = dbColumns.find((dc) => dc.column_name === col.name);

            // If column doesn't exist, add it
            if (!dbCol) {
                try {
                    // Add missing column
                    const alterSQL = `ALTER TABLE "${schema.name}" ADD COLUMN ${this.generateColumnDefinition(col)}`;
                    await this.client.query(alterSQL);
                } catch (e) {
                    console.error(e);
                    throw new Error(`Failed to add column "${col.name}" to table "${schema.name}".`);
                }

                // Add foreign key if references are defined
                if (col.references) {
                    try {
                        const fkSQL = `ALTER TABLE "${schema.name}" ADD FOREIGN KEY ("${col.name}") REFERENCES "${col.references.table}"("${col.references.column}")`;
                        await this.client.query(fkSQL);
                    } catch (e) {
                        console.error(e);
                        throw new Error(`Failed to add foreign key for column "${col.name}" in table "${schema.name}".`);
                    }
                }

                await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "column_added");
            } else {
                // ----------------------------
                // Check/Update Column Type
                // ----------------------------
                const normalizedDBType = normalizeDBColumnType(dbCol.data_type, dbCol.udt_name);
                const normalizedSchemaType = normalizeSchemaColumnType(col.type);

                if (normalizedDBType !== normalizedSchemaType) {
                    try {
                        const alterTypeSQL = `ALTER TABLE "${schema.name}" ALTER COLUMN "${col.name}" TYPE ${col.type} USING "${col.name}"::${col.type}`;
                        await this.client.query(alterTypeSQL);
                        await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "type_changed");
                    } catch (e) {
                        console.error(e);
                        throw new Error(`Failed to alter type of column "${col.name}" in table "${schema.name}".`);
                    }
                }

                // ----------------------------
                // Check/Update Nullable
                // ----------------------------
                const isNullableInDB = dbCol.is_nullable === "YES";
                if (isNullableInDB && !col.nullable) {
                    // Currently nullable, but should NOT be
                    try {
                        const alterNullSQL = `ALTER TABLE "${schema.name}" ALTER COLUMN "${col.name}" SET NOT NULL`;
                        await this.client.query(alterNullSQL);
                        await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "nullable_changed_to_not_null");
                    } catch (e) {
                        console.error(e);
                        throw new Error(`Failed to set NOT NULL on column "${col.name}" in table "${schema.name}".`);
                    }
                } else if (!isNullableInDB && col.nullable) {
                    // Currently NOT NULL, but should be nullable
                    try {
                        const alterNullSQL = `ALTER TABLE "${schema.name}" ALTER COLUMN "${col.name}" DROP NOT NULL`;
                        await this.client.query(alterNullSQL);
                        await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "nullable_changed_to_null");
                    } catch (e) {
                        console.error(e);
                        throw new Error(`Failed to drop NOT NULL on column "${col.name}" in table "${schema.name}".`);
                    }
                }

                // ----------------------------
                // Check/Update Default
                // ----------------------------
                const desiredDefault = col.defaultValue;
                const currentDefault: string | null = dbCol.column_default;
                const normCurrent = normalizeDefaultValue(currentDefault, col.type);
                const normDesired = normalizeDefaultValue(desiredDefault, col.type);

                let defaultsDiffer = false;
                if (col.type.includes("json")) {
                    defaultsDiffer = normCurrent.toLowerCase() !== normDesired.toLowerCase();
                } else {
                    defaultsDiffer = normCurrent !== normDesired;
                }

                if (defaultsDiffer) {
                    if (desiredDefault !== undefined && desiredDefault !== null) {
                        let defaultClause: string;
                        const isJSON = col.type.toLowerCase().includes("json");

                        if (isJSON) {
                            const parsed = JSON.parse(normDesired);
                            const jsonStr = JSON.stringify(parsed);
                            const castType = col.type.toLowerCase().includes("jsonb") ? "::jsonb" : "::json";
                            defaultClause = `'${jsonStr}'${castType}`;
                        } else if (typeof desiredDefault === "string") {
                            const isFunctionCall = desiredDefault.endsWith("()");
                            const isCastExpression = desiredDefault.includes("::");
                            if (isFunctionCall || isCastExpression) {
                                defaultClause = desiredDefault.toLowerCase();
                            } else {
                                defaultClause = `'${desiredDefault.toLowerCase()}'`;
                            }
                        } else {
                            defaultClause = String(desiredDefault).toLowerCase();
                        }

                        try {
                            const alterDefaultSQL = `ALTER TABLE "${schema.name}" ALTER COLUMN "${col.name}" SET DEFAULT ${defaultClause}`;
                            await this.client.query(alterDefaultSQL);

                            await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "default_changed");
                        } catch (e) {
                            console.error(e);
                            throw new Error(`Failed to alter default value of column "${col.name}" in table "${schema.name}".`);
                        }
                    } else {
                        try {
                            const dropDefaultSQL = `ALTER TABLE "${schema.name}" ALTER COLUMN "${col.name}" DROP DEFAULT`;
                            await this.client.query(dropDefaultSQL);

                            await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, col.name, "default_dropped");
                        } catch (e) {
                            console.error(e);
                            throw new Error(`Failed to drop default value of column "${col.name}" in table "${schema.name}".`);
                        }
                    }
                }
            }
        }

        // Remove columns that are not in the schema definition
        await this.removeExtraColumns(schema);
    }

    /**
     * @method getTableColumns Retrieves the columns of a table from the database.
     *
     * @param tableName The name of the table to retrieve columns from.
     * @returns Promise<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null; udt_name: string }[]>
     */
    private async getTableColumns(tableName: string): Promise<{ column_name: string; data_type: string; is_nullable: string; column_default: string | null; udt_name: string }[]> {
        const res = await this.client.query(
            `SELECT column_name, data_type, is_nullable, column_default, udt_name
             FROM information_schema.columns
             WHERE table_name = $1;`,
            [tableName],
        );
        return res.rows;
    }

    /**
     * @method removeExtraColumns Removes extra columns from the table.
     *
     * @description Detect removed columns from the schema and remove them from the table.
     *
     * After ensuring that missing columns are added and defaults updated, we compare
     * the actual columns in the database to the schema. Any column present in the table
     * but not defined in the schema will be dropped.
     *
     * @param schema The schema definition to compare against.
     * @returns Promise<void>
     */
    private async removeExtraColumns(schema: ITableSchemaDefinition): Promise<void> {
        const dbColumns = await this.getTableColumns(schema.name);
        const schemaColumnNames = schema.columns.map((col) => col.name);

        for (const dbCol of dbColumns) {
            if (!schemaColumnNames.includes(dbCol.column_name)) {
                const dropSQL = `ALTER TABLE "${schema.name}" DROP COLUMN "${dbCol.column_name}"`;
                await this.client.query(dropSQL);

                await emitter.emitAsync(Events.DATABASE_TABLE_ALTERED, schema.name, dbCol.column_name, "column_removed");
            }
        }
    }

    // ------------------- Data Operations -------------------

    /**
     * @method insert Inserts a new record with improved performance.
     */
    public async insert<T extends object>(tableName: string, data: T): Promise<T> {
        const columns = Object.keys(data);
        const values = Object.values(data);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

        const sql = `
            INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(", ")})
            VALUES (${placeholders})
            RETURNING *
        `;

        const result = await this.query(sql, values);
        return result.rows[0];
    }

    /**
     * @method batchInsert Inserts multiple records efficiently.
     */
    public async batchInsert<T extends object>(tableName: string, records: T[]): Promise<T[]> {
        if (records.length === 0) return [];

        const columns = Object.keys(records[0]);
        const values = records.map(Object.values);
        let placeholderIndex = 1;
        const valuePlaceholders = values.map((row) => `(${row.map(() => `$${placeholderIndex++}`).join(", ")})`).join(", ");

        const sql = `
            INSERT INTO "${tableName}" (${columns.map((c) => `"${c}"`).join(", ")})
            VALUES ${valuePlaceholders}
            RETURNING *
        `;

        const flatValues = values.flat();
        const result = await this.query(sql, flatValues);
        return result.rows;
    }

    /**
     * @method update Updates records with improved performance.
     */
    public async update<T extends object>(tableName: string, data: Partial<T>, where: Partial<T>): Promise<void> {
        const setColumns = Object.keys(data);
        const setValues = Object.values(data);
        const whereColumns = Object.keys(where);
        const whereValues = Object.values(where);

        const setClause = setColumns.map((col, i) => `"${col}" = $${i + 1}`).join(", ");
        const whereClause = whereColumns.map((col, i) => `"${col}" = $${i + setValues.length + 1}`).join(" AND ");

        const sql = `
            UPDATE "${tableName}"
            SET ${setClause}
            WHERE ${whereClause}
        `;

        await this.query(sql, [...setValues, ...whereValues]);
    }

    public async delete<T extends object>(tableName: string, where: Partial<T>): Promise<void> {
        try {
            const whereKeys = Object.keys(where);
            const whereClause = whereKeys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ");
            const sql = `DELETE FROM "${tableName}" WHERE ${whereClause}`;
            await this.client.query(sql, Object.values(where));
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to delete data from table "${tableName}".`);
        }
    }

    public async deleteAll(tableName: string): Promise<void> {
        try {
            const sql = `DELETE FROM "${tableName}"`;
            await this.client.query(sql);
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to delete all data from table "${tableName}".`);
        }
    }

    public async select<T extends object>(tableName: string, where?: Partial<T>): Promise<T[]> {
        try {
            let sql = `SELECT * FROM "${tableName}"`;
            let values: any[] = [];
            if (where && Object.keys(where).length > 0) {
                const whereKeys = Object.keys(where);
                const whereClause = whereKeys.map((k, i) => `"${k}" = $${i + 1}`).join(" AND ");
                sql += ` WHERE ${whereClause}`;
                values = Object.values(where);
            }

            const res = await this.client.query(sql, values);
            return res.rows as T[];
        } catch (e) {
            console.error(e);
            throw new Error(`Failed to select data from table "${tableName}".`);
        }
    }
}
