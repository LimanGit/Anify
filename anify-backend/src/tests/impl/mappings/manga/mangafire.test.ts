import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import MangaFire from "../../../../mappings/impl/manga/impl/mangafire";

const mangafire = new MangaFire();

test(
    "Manga.MangaFire.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangafire.search("Mushoku Tensei");

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
    "Manga.MangaFire.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await mangafire.search("Mushoku Tensei");
        const data = await mangafire.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.MangaFire.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await mangafire.search("Mushoku Tensei");
        const data1 = await mangafire.fetchChapters(resp?.[0].id ?? "");
        const data = await mangafire.fetchPages(data1?.[0].id ?? "");

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
