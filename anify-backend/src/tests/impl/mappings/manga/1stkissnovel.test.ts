import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import FirstKissNovel from "../../../../mappings/impl/manga/impl/1stkissnovel";

const firstKissNovel = new FirstKissNovel();

test(
    "Manga.1stkissnovel.Search",
    async (done) => {
        await preloadProxies();
        const data = await firstKissNovel.search("Mushoku Tensei");

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
    "Manga.1stkissnovel.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await firstKissNovel.search("Mushoku Tensei");
        const data = await firstKissNovel.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.1stkissnovel.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await firstKissNovel.search("Mushoku Tensei");
        const data1 = await firstKissNovel.fetchChapters(resp?.[0].id ?? "");
        const data = await firstKissNovel.fetchPages(data1?.[0].id ?? "");

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
