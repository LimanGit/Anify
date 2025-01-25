import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import TMDBMeta from "../../../../mappings/impl/meta/impl/tmdb";

const tmdb = new TMDBMeta();

test(
    "Meta.TMDB.Search",
    async (done) => {
        await preloadProxies();
        const data = await tmdb.search("Mushoku Tensei");

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
