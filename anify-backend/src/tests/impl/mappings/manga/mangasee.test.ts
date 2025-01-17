import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import MangaSee from "../../../../mappings/impl/manga/impl/mangasee";

const mangasee = new MangaSee();

test(
    "Manga.MangaSee.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangasee.search("Mushoku Tensei");

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
    "Manga.MangaSee.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await mangasee.search("Mushoku Tensei");
        const data = await mangasee.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.MangaSee.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await mangasee.search("Mushoku Tensei");
        const data1 = await mangasee.fetchChapters(resp?.[0].id ?? "");
        const data = await mangasee.fetchPages(data1?.[0].id ?? "");

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
