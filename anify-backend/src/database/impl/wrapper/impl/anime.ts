import type { IAnime } from "../../../../types/impl/database/impl/schema/anime";
import DatabaseHandler from "../../handler";

export class AnimeRepository {
    /**
     * @description The table name for anime.
     */
    public static readonly tableName = "anify.anime";

    /**
     * @method getById Retrieves a single anime record by ID.
     * @param db The DatabaseHandler instance.
     * @param id The ID of the anime to retrieve.
     * @returns IAnime or null if not found.
     */
    public static async getById(db: DatabaseHandler, id: string): Promise<IAnime | null> {
        const rows = await db.select<IAnime>(AnimeRepository.tableName, { id });
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * @method getBySlug Retrieves a single anime record by slug.
     * @param db The DatabaseHandler instance.
     * @param slug The slug of the anime to retrieve.
     * @returns IAnime or null if not found.
     */
    public static async getBySlug(db: DatabaseHandler, slug: string): Promise<IAnime | null> {
        const rows = await db.select<IAnime>(AnimeRepository.tableName, { slug });
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * @method insert Inserts a new anime record and returns the newly created row.
     * @param db The DatabaseHandler instance.
     * @param anime The anime object to insert.
     * @returns The inserted anime row (with defaults applied).
     */
    public static async insert(db: DatabaseHandler, anime: IAnime): Promise<IAnime> {
        const inserted = await db.insert<IAnime>(AnimeRepository.tableName, anime);
        return inserted;
    }

    /**
     * @method updatePartially Updates a subset of fields in the anime record.
     * @param db The DatabaseHandler instance.
     * @param id The anime ID to update.
     * @param newData The fields to update.
     */
    public static async updatePartially(db: DatabaseHandler, id: string, newData: Partial<IAnime>): Promise<void> {
        await db.update<IAnime>(AnimeRepository.tableName, newData, { id });
    }

    /**
     * @method deleteById
     * Deletes an Anime record by its ID.
     *
     * @param db  The DatabaseHandler instance.
     * @param id  The ID of the record to delete.
     */
    public static async deleteById(db: DatabaseHandler, id: string): Promise<void> {
        const sql = `
            DELETE FROM "${AnimeRepository.tableName}"
            WHERE "id" = $1
        `;
        await db.query(sql, [id]);
    }

    /**
     * @method countAll
     * Returns the total number of anime in the anime table.
     *
     * @param db The DatabaseHandler instance.
     */
    public static async countAll(db: DatabaseHandler): Promise<number> {
        const sql = `
            SELECT COUNT(*) AS "total"
            FROM "${AnimeRepository.tableName}"
        `;
        const result = await db.query(sql);
        // Convert the result's string to a number
        return parseInt(result.rows[0].total, 10);
    }

    /**
     * @method fetchAll Retrieves all anime records.
     * @param db The DatabaseHandler instance.
     * @returns Array of IAnime objects.
     */
    public static async fetchAll(db: DatabaseHandler): Promise<IAnime[]> {
        return db.select<IAnime>(AnimeRepository.tableName);
    }

    // Feel free to add more specialized queries:
    // e.g. fetchSeasonalAnime, searchByTitle, fetchTrending, etc.
}
