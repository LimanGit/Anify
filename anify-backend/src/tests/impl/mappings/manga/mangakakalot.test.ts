import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import Mangakakalot from "../../../../mappings/impl/manga/impl/mangakakalot";

const mangakakalot = new Mangakakalot();

test(
    "Manga.Mangakakalot.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangakakalot.search("Mushoku Tensei");

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
    "Manga.Mangakakalot.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await mangakakalot.search("Mushoku Tensei");
        const data = await mangakakalot.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.Mangakakalot.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await mangakakalot.search("Mushoku Tensei");
        const data1 = await mangakakalot.fetchChapters(resp?.[0].id ?? "");
        const data = await mangakakalot.fetchPages(data1?.[0].id ?? "");

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
