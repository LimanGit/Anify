import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import ComicK from "../../../../mappings/impl/manga/impl/comick";

const comick = new ComicK();

test(
    "Manga.ComicK.Search",
    async (done) => {
        await preloadProxies();
        const data = await comick.search("Mushoku Tensei");

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
    "Manga.ComicK.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await comick.search("Mushoku Tensei");
        const data = await comick.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.ComicK.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await comick.search("Mushoku Tensei");
        const data1 = await comick.fetchChapters(resp?.[0].id ?? "");
        const data = await comick.fetchPages(data1?.[0].id ?? "");

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
