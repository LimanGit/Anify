import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { MediaFormat } from "../../../../types";
import AniDBMeta from "../../../../mappings/impl/meta/impl/anidb";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const anidb = new AniDBMeta();

test(
    "Meta.AniDB.Search",
    async (done) => {
        await preloadProxies();
        const data = await anidb.search("Mushoku Tensei", MediaFormat.TV);

        expect(data).toBeDefined();
        expect(data).not.toBeEmpty();

        if (env.DEBUG) {
            console.log(data);
        }

        done();
    },
    {
        timeout: 20000,
    },
);
