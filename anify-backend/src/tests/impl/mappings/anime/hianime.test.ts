import { expect, test } from "bun:test";
import { env } from "../../../../env";
import HiAnime from "../../../../mappings/impl/anime/impl/hianime";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const hiAnime = new HiAnime();

test(
    "Anime.HiAnime.Search",
    async (done) => {
        await preloadProxies();
        const data = await hiAnime.search("Mushoku Tensei");

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
    "Anime.HiAnime.Episodes",
    async (done) => {
        await preloadProxies();
        const resp = await hiAnime.search("Mushoku Tensei");
        const data = await hiAnime.fetchEpisodes(resp?.[0].id ?? "");

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
    "Anime.HiAnime.Sources",
    async (done) => {
        await preloadProxies();
        const resp = await hiAnime.search("Mushoku Tensei");
        const data1 = await hiAnime.fetchEpisodes(resp?.[0].id ?? "");
        const data = await hiAnime.fetchSources(data1?.[0].id ?? "");

        expect(data).toBeDefined();
        expect(data?.sources).not.toBeEmpty();

        if (env.DEBUG) {
            console.log(data);
        }

        done();
    },
    {
        timeout: 20000,
    },
);
