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

        await MediaRepository.deleteById(db, MediaType.ANIME, "113415");

        const mappings = await lib.loadMapping({
            id: "113415",
            type: MediaType.ANIME,
            formats: [MediaFormat.TV],
        });

        if (env.DEBUG) {
            console.log(mappings[0]);
        }
        done();
    },
    {
        timeout: 30000,
    },
);
