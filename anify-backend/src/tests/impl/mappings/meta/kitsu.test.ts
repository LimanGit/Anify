import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import KitsuMeta from "../../../../mappings/impl/meta/impl/kitsu";

const kitsu = new KitsuMeta();

test(
    "Meta.Kitsu.Search",
    async (done) => {
        await preloadProxies();
        const data = await kitsu.search("Mushoku Tensei");

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
