import { expect, test } from "bun:test";
import { env } from "../../../../env";
import { MediaFormat, MediaType, ProviderType } from "../../../../types";
import MangaDexInfo from "../../../../mappings/impl/information/impl/mangadex";
import { preloadProxies } from "../../../../proxies/impl/manager/impl/file/preloadProxies";

const mangadex = new MangaDexInfo();

test(
    "Information.MangaDex.Info",
    async (done) => {
        await preloadProxies();
        const data = await mangadex.info({
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
            chapters: {
                data: [],
                latest: {
                    latestChapter: 0,
                    latestTitle: "",
                    updatedAt: 0,
                },
            },
            format: MediaFormat.MANGA,
            genres: [],
            id: "bd6d0982-0091-4945-ad70-c028ed3c0917",
            mappings: [
                {
                    id: "bd6d0982-0091-4945-ad70-c028ed3c0917",
                    providerId: "mangadex",
                    providerType: ProviderType.META,
                    similarity: 1,
                },
            ],
            popularity: null,
            rating: null,
            relations: [],
            slug: "mushoku-tensei-isekai-ittara-honki-dasu",
            status: null,
            synonyms: [],
            tags: [],
            title: {
                english: "Mushoku Tensei: Jobless Reincarnation",
                native: "無職転生 ～異世界行ったら本気だす～",
                romaji: "Mushoku Tensei: Isekai Ittara Honki Dasu",
            },
            totalChapters: 0,
            totalVolumes: 0,
            type: MediaType.MANGA,
            year: 2021,
            author: null,
            currentChapter: null,
            publisher: null,
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
