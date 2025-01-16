/**
 * @description Normalizes a database column type using data_type and udt_name.
 * For arrays, data_type might be 'ARRAY', so we rely on udt_name.
 * Example: TEXT[] -> udt_name = '_text', which we map back to 'text[]'.
 *
 * @param dataType The data type of the column.
 * @param udtName The user-defined type name of the column.
 * @returns The normalized column type.
 */
export function normalizeDBColumnType(dataType: string, udtName: string): string {
    if (dataType === "ARRAY") {
        // udtName usually starts with an underscore for arrays, e.g. '_text'
        const baseType = udtName.startsWith("_") ? udtName.slice(1) : udtName;
        return `${baseType}[]`;
    }

    switch (dataType.toLowerCase()) {
        case "integer":
            return "int";
        case "varying":
        case "character varying":
            return "varchar";
        case "character":
            return "char";
        case "timestamp with time zone":
            return "timestamptz";
        case "timestamp without time zone":
            return "timestamp";
        default:
            return dataType.toLowerCase();
    }
}

/**
 * @description Normalizes the schema column type to match the style of normalized DB type.
 * If it's an array (ends with []), we try to match the pattern that normalizeDBColumnType returns.
 * e.g. 'TEXT[]' becomes 'text[]', 'INTEGER[]' -> 'integer[]'.
 *
 * @param schemaType The schema column type.
 * @returns The normalized schema column type.
 */
export function normalizeSchemaColumnType(schemaType: string): string {
    return schemaType.toLowerCase();
}
