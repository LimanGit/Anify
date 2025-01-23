import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import MALMeta from "../../../../mappings/impl/meta/impl/mal";

const mal = new MALMeta();

test(
    "Meta.MAL.Search",
    async (done) => {
        await preloadProxies();
        const data = await mal.search("Mushoku Tensei");

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
