import { expect, test } from "bun:test";
import { env } from "../../../../env";
import Sudatchi from "../../../../mappings/impl/anime/impl/sudatchi";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const sudatchi = new Sudatchi();

test(
    "Anime.Sudatchi.Search",
    async (done) => {
        await preloadProxies();
        const data = await sudatchi.search("Mushoku Tensei");

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
    "Anime.Sudatchi.Episodes",
    async (done) => {
        await preloadProxies();
        const resp = await sudatchi.search("Mushoku Tensei");
        const data = await sudatchi.fetchEpisodes(resp?.[0].id ?? "");

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
    "Anime.Sudatchi.Sources",
    async (done) => {
        await preloadProxies();
        const resp = await sudatchi.search("Mushoku Tensei");
        const data1 = await sudatchi.fetchEpisodes(resp?.[0].id ?? "");
        const data = await sudatchi.fetchSources(data1?.[0].id ?? "");

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
