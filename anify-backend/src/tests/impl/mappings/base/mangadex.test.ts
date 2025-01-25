import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { MediaFormat, MediaType } from "../../../../types";
import MangaDexBase from "../../../../mappings/impl/base/impl/mangadex";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const mangadex = new MangaDexBase();

test(
    "Base.MangaDex.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.search("Mushoku Tensei", MediaType.MANGA, [MediaFormat.MANGA], 0, 10);

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
    "Base.MangaDex.SearchAdvanced",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.searchAdvanced("Mushoku Tensei", MediaType.MANGA, [MediaFormat.MANGA], 0, 10, [], [], undefined, undefined, ["Action"], []);

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
    "Base.MangaDex.GetMedia",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.getMedia("bd6d0982-0091-4945-ad70-c028ed3c0917");

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
    "Base.MangaDex.Seasonal",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.fetchSeasonal();

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
