import type { IColumnDefinition } from "../../../../types/impl/database";

const mangaSchema = [
    { name: "id", type: "TEXT", primaryKey: true, defaultValue: "gen_random_uuid()" },
    { name: "slug", type: "TEXT" },
    { name: "coverImage", type: "TEXT" },
    { name: "bannerImage", type: "TEXT" },
    { name: "status", type: "VARCHAR" },
    { name: "title", type: "JSONB" },
    { name: "currentChapter", type: "REAL", nullable: true },
    { name: "mappings", type: "JSONB", defaultValue: "'[]'::JSONB" },
    { name: "synonyms", type: "TEXT[]", defaultValue: "'{}'::TEXT[]" },
    { name: "countryOfOrigin", type: "TEXT" },
    { name: "description", type: "TEXT", nullable: true },
    { name: "color", type: "TEXT", nullable: true },
    { name: "year", type: "INT" },
    { name: "rating", type: "JSONB", nullable: true },
    { name: "popularity", type: "JSONB", nullable: true },
    { name: "type", type: "TEXT" },
    { name: "format", type: "VARCHAR", defaultValue: "UNKNOWN" },
    { name: "relations", type: "JSONB[]", defaultValue: "'{}'::JSONB[]" },
    { name: "totalChapters", type: "REAL" },
    { name: "totalVolumes", type: "REAL" },
    { name: "genres", type: "TEXT[]", defaultValue: "'{}'::TEXT[]" },
    { name: "tags", type: "TEXT[]", defaultValue: "'{}'::TEXT[]" },
    { name: "chapters", type: "JSONB", defaultValue: `'{"latest": {"updatedAt": 0, "latestChapter": 0, "latestTitle": ""}, "data": []}'::JSONB` },
    { name: "averageRating", type: "REAL" },
    { name: "averagePopularity", type: "REAL" },
    { name: "artwork", type: "JSONB[]", defaultValue: "ARRAY[]::JSONB[]" },
    { name: "characters", type: "JSONB[]", defaultValue: "ARRAY[]::JSONB[]" },
    { name: "author", type: "TEXT", nullable: true },
    { name: "publisher", type: "TEXT", nullable: true },
    { name: "createdAt", type: "TIMESTAMP", defaultValue: "NOW()" },
] as IColumnDefinition[];

export default mangaSchema;
