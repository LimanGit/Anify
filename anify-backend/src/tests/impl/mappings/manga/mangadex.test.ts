import { expect, test } from "bun:test";
import { env } from "../../../../env";
import MangaDex from "../../../../mappings/impl/manga/impl/mangadex";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const mangadex = new MangaDex();

test(
    "Manga.MangaDex.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.search("Mushoku Tensei");

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
    "Manga.MangaDex.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await mangadex.search("Mushoku Tensei");
        const data = await mangadex.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.MangaDex.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await mangadex.search("Mushoku Tensei");
        const data1 = await mangadex.fetchChapters(resp?.[0].id ?? "");
        const data = await mangadex.fetchPages(data1?.[0].id ?? "");

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
