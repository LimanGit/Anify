import { expect, test } from "bun:test";
import { env } from "../../../../env";
import AniListBase from "../../../../mappings/impl/base/impl/anilist";
import { MediaFormat, MediaType } from "../../../../types";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const anilist = new AniListBase();

test(
    "Base.AniList.Search",
    async (done) => {
        await preloadProxies();
        const data = await anilist.search("Mushoku Tensei", MediaType.ANIME, [MediaFormat.TV], 0, 10);

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

test(
    "Base.AniList.GetMedia",
    async (done) => {
        await preloadProxies();
        const data = await anilist.getMedia("21");

        expect(data).toBeDefined();

        if (env.DEBUG) {
            console.log(data);
        }

        done();
    },
    {
        timeout: 20000,
    },
);

test(
    "Base.AniList.Seasonal",
    async (done) => {
        await preloadProxies();
        const data = await anilist.fetchSeasonal(MediaType.ANIME, [MediaFormat.TV]);

        expect(data).toBeDefined();
        expect(data?.popular).not.toBeEmpty();
        expect(data?.seasonal).not.toBeEmpty();
        expect(data?.top).not.toBeEmpty();
        expect(data?.trending).not.toBeEmpty();

        if (env.DEBUG) {
            console.log(data);
        }

        done();
    },
    {
        timeout: 20000,
    },
);
