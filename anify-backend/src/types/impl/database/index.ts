/**
 * @fileoverview Main entry point for the database types.
 */

import { MediaType } from "../..";
import type { IAnime } from "./impl/schema/anime";
import type { IManga } from "./impl/schema/manga";

/**
 * @description Represents the data type of a column in a SQL database
 */
export type SQLDataType = "TEXT" | "TEXT[]" | "VARCHAR" | "INT" | "BIGINT" | "REAL" | "BOOLEAN" | "DATE" | "TIMESTAMP" | "JSONB" | "JSONB[]" | "FLOAT" | "DOUBLE PRECISION" | "SERIAL" | "BIGSERIAL" | "UUID";

/**
 * @description Represents a column definition in a SQL database
 */
export interface IColumnDefinition {
    name: string;
    type: SQLDataType;
    nullable?: boolean;
    primaryKey?: boolean;
    defaultValue?: string | number | boolean | null;
    unique?: boolean;
    references?: { table: string; column: string };
}

/**
 * @description Represents a table schema definition in a SQL database
 */
export interface ITableSchemaDefinition {
    name: string;
    columns: IColumnDefinition[];
}

/**
 * @description Represents a collection of table schema definitions in a SQL database
 */
export interface ITableSchemas {
    [tableName: string]: ITableSchemaDefinition;
}

/**
 * @description Structure for items we want to batch insert:
 * Each item has a type (ANIME or MANGA) and the record data.
 */
export interface IMediaInsertItem {
    type: MediaType;
    data: IAnime | IManga;
}
