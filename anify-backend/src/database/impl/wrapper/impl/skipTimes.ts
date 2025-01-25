import type { ISkipTime } from "../../../../types/impl/database/impl/schema/skipTimes";
import DatabaseHandler from "../../handler";

export class SkipTimesRepository {
    /**
     * @description The table name for skip times.
     */
    public static readonly tableName = "anify.skip_times";

    /**
     * @method getById Retrieves a single skip time record by ID.
     * @param db The DatabaseHandler instance.
     * @param id The ID of the skip time to retrieve.
     * @returns ISkipTime or null if not found.
     */
    public static async getById(db: DatabaseHandler, id: string): Promise<ISkipTime | null> {
        const rows = await db.select<ISkipTime>(SkipTimesRepository.tableName, { id });
        return rows.length > 0 ? rows[0] : null;
    }

    /**
     * @method insert Inserts a new skop time record and returns the newly created row.
     * @param db The DatabaseHandler instance.
     * @param anime The skip time object to insert.
     * @returns The inserted skip time row (with defaults applied).
     */
    public static async insert(db: DatabaseHandler, skipTime: ISkipTime): Promise<ISkipTime> {
        const inserted = await db.insert<ISkipTime>(SkipTimesRepository.tableName, skipTime);
        return inserted;
    }

    /**
     * @method updatePartially Updates a subset of fields in the skip times record.
     * @param db The DatabaseHandler instance.
     * @param id The skip times ID to update.
     * @param newData The fields to update.
     */
    public static async updatePartially(db: DatabaseHandler, id: string, newData: Partial<ISkipTime>): Promise<void> {
        await db.update<ISkipTime>(SkipTimesRepository.tableName, newData, { id });
    }

    /**
     * @method countAll
     * Returns the total number of skip times in the skiptimes table.
     *
     * @param db The DatabaseHandler instance.
     */
    public static async countAll(db: DatabaseHandler): Promise<number> {
        const sql = `
            SELECT COUNT(*) AS "total"
            FROM "${SkipTimesRepository.tableName}"
        `;
        const result = await db.query(sql);
        // Convert the result's string to a number
        return parseInt(result.rows[0].total, 10);
    }

    /**
     * @method fetchAll Retrieves all skip times records.
     * @param db The DatabaseHandler instance.
     * @returns Array of ISkipTime objects.
     */
    public static async fetchAll(db: DatabaseHandler): Promise<ISkipTime[]> {
        return db.select<ISkipTime>(SkipTimesRepository.tableName);
    }
}
