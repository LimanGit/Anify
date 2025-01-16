import type { IManga } from "../../../../types/impl/database/impl/schema/manga";
import DatabaseHandler from "../../handler";

export class MangaRepository {
    /**
     * @description The table name for manga.
     */
    public static readonly tableName = "anify.manga";

    /**
     * @method getById Retrieves a single manga record by ID.
     * @param db The DatabaseHandler instance.
     * @param id The ID of the manga to retrieve.
     * @returns IManga or null if not found.
     */
    public static async getById(db: DatabaseHandler, id: string): Promise<IManga | null> {
        const rows = await db.select<IManga>(MangaRepository.tableName, { id });
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * @method getBySlug Retrieves a single manga record by slug.
     * @param db The DatabaseHandler instance.
     * @param slug The slug of the manga to retrieve.
     * @returns IManga or null if not found.
     */
    public static async getBySlug(db: DatabaseHandler, slug: string): Promise<IManga | null> {
        const rows = await db.select<IManga>(MangaRepository.tableName, { slug });
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * @method insert Inserts a new manga record and returns the newly created row.
     * @param db The DatabaseHandler instance.
     * @param manga The manga object to insert.
     * @returns The inserted manga row (with defaults applied).
     */
    public static async insert(db: DatabaseHandler, manga: IManga): Promise<IManga> {
        const inserted = await db.insert<IManga>(MangaRepository.tableName, manga);
        return inserted;
    }

    /**
     * @method updatePartially Updates a subset of fields in the manga record.
     * @param db The DatabaseHandler instance.
     * @param id The manga ID to update.
     * @param newData The fields to update.
     */
    public static async updatePartially(db: DatabaseHandler, id: string, newData: Partial<IManga>): Promise<void> {
        await db.update<IManga>(MangaRepository.tableName, newData, { id });
    }

    /**
     * @method deleteById
     * Deletes a Manga record by its ID.
     *
     * @param db  The DatabaseHandler instance.
     * @param id  The ID of the record to delete.
     */
    public static async deleteById(db: DatabaseHandler, id: string): Promise<void> {
        const sql = `
            DELETE FROM "${MangaRepository.tableName}"
            WHERE "id" = $1
        `;
        await db.query(sql, [id]);
    }

    /**
     * @method countAll
     * Returns the total number of manga in the manga table.
     *
     * @param db The DatabaseHandler instance.
     */
    public static async countAll(db: DatabaseHandler): Promise<number> {
        const sql = `
            SELECT COUNT(*) AS "total"
            FROM "${MangaRepository.tableName}"
        `;
        const result = await db.query(sql);
        // Convert the result's string to a number
        return parseInt(result.rows[0].total, 10);
    }

    /**
     * @method fetchAll Retrieves all manga records.
     * @param db The DatabaseHandler instance.
     * @returns Array of IManga objects.
     */
    public static async fetchAll(db: DatabaseHandler): Promise<IManga[]> {
        return db.select<IManga>(MangaRepository.tableName);
    }

    // Same as anime, you can add specialized queries:
    // e.g. fetchByChapterRange, searchByTitle, etc.
}
