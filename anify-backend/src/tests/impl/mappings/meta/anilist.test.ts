import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { MediaFormat } from "../../../../types";
import AniListMeta from "../../../../mappings/impl/meta/impl/anilist";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const anilist = new AniListMeta();

test(
    "Meta.AniList.Search",
    async (done) => {
        await preloadProxies();
        const data = await anilist.search("Mushoku Tensei", MediaFormat.TV);

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
