import type { IColumnDefinition } from "../../../../types/impl/database";

const skipTimesSchema = [
    { name: "id", type: "TEXT", primaryKey: true, defaultValue: "gen_random_uuid()" },
    { name: "episodes", type: "JSONB[]" },
    { name: "createdAt", type: "TIMESTAMP", defaultValue: "NOW()" },
] as IColumnDefinition[];

export default skipTimesSchema;
