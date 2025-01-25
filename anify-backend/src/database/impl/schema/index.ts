import type { IColumnDefinition, ITableSchemas } from "../../../types/impl/database";

export default class SchemaBuilder {
    private schemas: ITableSchemas = {};

    public defineTable(name: string, columns: IColumnDefinition[]): this {
        this.schemas[name] = { name, columns };
        return this;
    }

    public getSchemas(): ITableSchemas {
        return this.schemas;
    }
}
