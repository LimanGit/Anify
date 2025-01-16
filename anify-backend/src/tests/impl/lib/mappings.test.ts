import { test } from "bun:test";
import { db, init as initDB } from "../../../database";
import lib from "../../../lib";
import { MediaFormat, MediaType } from "../../../types";
import { env } from "../../../env";
import { MediaRepository } from "../../../database/impl/wrapper/impl/media";

test(
    "MappingsHandler",
    async (done) => {
        await initDB();

        await MediaRepository.deleteById(db, MediaType.MANGA, "81fbe9c6-7bd2-40c1-a9ee-e941af5643f4");

        const mappings = await lib.loadMapping({
            id: "81fbe9c6-7bd2-40c1-a9ee-e941af5643f4",
            type: MediaType.MANGA,
            formats: [MediaFormat.MANGA],
        });

        if (env.DEBUG) {
            console.log(mappings);
        }
        done();
    },
    {
        timeout: 30000,
    },
);
