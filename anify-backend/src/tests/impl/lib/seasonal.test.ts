import { expect, test } from "bun:test";
import { init as initDB } from "../../../database";
import lib from "../../../lib";
import { MediaFormat, MediaType } from "../../../types";
import { env } from "../../../env";

test(
    "SeasonalHandler",
    async (done) => {
        await initDB();

        const seasonal = await lib.loadSeasonal({
            type: MediaType.ANIME,
            formats: [MediaFormat.TV],
        });

        if (env.DEBUG) {
            console.log(seasonal);
        }

        expect(seasonal).toBeDefined();
        expect(seasonal).not.toBeEmpty();

        done();
    },
    {
        timeout: 10000,
    },
);
