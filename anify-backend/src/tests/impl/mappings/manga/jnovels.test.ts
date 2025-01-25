import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";
import JNovels from "../../../../mappings/impl/manga/impl/jnovels";

const jnovels = new JNovels();

test(
    "Manga.JNovels.Search",
    async (done) => {
        await preloadProxies();
        const data = await jnovels.search("Mushoku Tensei");

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
    "Manga.JNovels.Chapters",
    async (done) => {
        await preloadProxies();
        const resp = await jnovels.search("Mushoku Tensei");
        const data = await jnovels.fetchChapters(resp?.[0].id ?? "");

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
    "Manga.JNovels.Pages",
    async (done) => {
        await preloadProxies();
        const resp = await jnovels.search("Mushoku Tensei");
        const data1 = await jnovels.fetchChapters(resp?.[0].id ?? "");
        const data = await jnovels.fetchPages(data1?.[0].id ?? "");

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
