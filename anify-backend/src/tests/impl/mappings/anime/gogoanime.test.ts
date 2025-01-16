import { expect, test } from "bun:test";
import { StreamingServers, SubType } from "../../../../types/impl/mappings/impl/anime";
import { env } from "../../../../env";
import GogoAnime from "../../../../mappings/impl/anime/impl/gogoanime";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const gogoAnime = new GogoAnime();

test(
    "Anime.GogoAnime.Search",
    async (done) => {
        await preloadProxies();
        const data = await gogoAnime.search("Mushoku Tensei");

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
    "Anime.GogoAnime.Episodes",
    async (done) => {
        await preloadProxies();
        const resp = await gogoAnime.search("Mushoku Tensei");
        const data = await gogoAnime.fetchEpisodes(resp?.[0].id ?? "");

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
    "Anime.GogoAnime.Sources",
    async (done) => {
        await preloadProxies();
        const resp = await gogoAnime.search("Mushoku Tensei");
        const data1 = await gogoAnime.fetchEpisodes(resp?.[0].id ?? "");
        const data = await gogoAnime.fetchSources(data1?.[0].id ?? "", SubType.SUB, StreamingServers.GogoCDN);

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
