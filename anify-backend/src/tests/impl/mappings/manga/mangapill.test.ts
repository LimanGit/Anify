import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import MangaPill from "../../../../mappings/impl/manga/impl/mangapill";

const mangapill = new MangaPill();

test(
    "Manga.Mangapill.Search",
    async (done) => {
        await preloadProxies();
        const data = await mangapill.search("Mushoku Tensei");

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
    "Manga.Mangapill.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await mangapill.search("Mushoku Tensei");
        const data = await mangapill.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.Mangapill.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await mangapill.search("Mushoku Tensei");
        const data1 = await mangapill.fetchChapters(resp?.[0].id ?? "");
        const data = await mangapill.fetchPages(data1?.[0].id ?? "");

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
