import { expect, test } from "bun:test";
import AnimePahe from "../../../../mappings/impl/anime/impl/animepahe";
import { StreamingServers, SubType } from "../../../../types/impl/mappings/impl/anime";
import { env } from "../../../../env";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const animePahe = new AnimePahe();

test(
    "Anime.AnimePahe.Search",
    async (done) => {
        await preloadProxies();
        const data = await animePahe.search("Mushoku Tensei");

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
    "Anime.AnimePahe.Episodes",
    async (done) => {
        await preloadProxies();
        const resp = await animePahe.search("Mushoku Tensei");
        const data = await animePahe.fetchEpisodes(resp?.[0].id ?? "");

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
    "Anime.AnimePahe.Sources",
    async (done) => {
        await preloadProxies();
        const resp = await animePahe.search("Mushoku Tensei");
        const data1 = await animePahe.fetchEpisodes(resp?.[0].id ?? "");
        const data = await animePahe.fetchSources(data1?.[0].id ?? "", SubType.SUB, StreamingServers.Kwik);

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
