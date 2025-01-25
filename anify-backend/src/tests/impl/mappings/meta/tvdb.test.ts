import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import TVDBMeta from "../../../../mappings/impl/meta/impl/tvdb";

const tvdb = new TVDBMeta();

test(
    "Meta.TVDB.Search",
    async (done) => {
        await preloadProxies();
        const data = await tvdb.search("Mushoku Tensei");

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
