import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { MediaFormat, MediaSeason, MediaType, ProviderType } from "../../../../types";
import KitsuInformation from "../../../../mappings/impl/information/impl/kitsu";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const kitsu = new KitsuInformation();

test(
    "Information.Kitsu.Info",
    async (done) => {
        await preloadProxies();
        const data = await kitsu.info({
            artwork: [],
            averagePopularity: null,
            averageRating: null,
            bannerImage: null,
            characters: [],
            color: null,
            coverImage: null,
            countryOfOrigin: null,
            createdAt: new Date(Date.now()),
            description: null,
            currentEpisode: 0,
            duration: null,
            episodes: {
                data: [],
                latest: {
                    latestEpisode: 0,
                    latestTitle: "",
                    updatedAt: 0,
                },
            },
            format: MediaFormat.TV,
            genres: [],
            id: "108465",
            mappings: [
                {
                    id: "42323",
                    providerId: "kitsu",
                    providerType: ProviderType.META,
                    similarity: 1,
                },
            ],
            popularity: null,
            rating: null,
            relations: [],
            season: MediaSeason.UNKNOWN,
            slug: "mushoku-tensei-isekai-ittara-honki-dasu",
            status: null,
            synonyms: [],
            tags: [],
            title: {
                english: "Mushoku Tensei: Jobless Reincarnation",
                native: "無職転生 ～異世界行ったら本気だす～",
                romaji: "Mushoku Tensei: Isekai Ittara Honki Dasu",
            },
            totalEpisodes: 0,
            trailer: null,
            type: MediaType.ANIME,
            year: 2021,
        });

        expect(data).toBeDefined();

        if (env.DEBUG) {
            console.log(data);
        }

        done();
    },
    {
        timeout: 20000,
    },
);
