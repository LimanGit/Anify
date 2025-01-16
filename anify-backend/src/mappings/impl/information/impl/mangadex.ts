import InformationProvider from "..";
import { MediaFormat, MediaSeason, MediaStatus, MediaType, ProviderType } from "../../../../types";
import type { IAnime } from "../../../../types/impl/database/impl/schema/anime";
import type { IManga } from "../../../../types/impl/database/impl/schema/manga";
import type { AnimeInfo, MangaInfo, MediaInfoKeys } from "../../../../types/impl/mappings/impl/mediaInfo";

export default class MangaDexInfo extends InformationProvider<IAnime | IManga, AnimeInfo | MangaInfo> {
    override id = "mangadex";
    override url = "https://mangadex.org";

    private api = "https://api.mangadex.org";

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;

    override formats: MediaFormat[] = [MediaFormat.MANGA, MediaFormat.ONE_SHOT];

    override get priorityArea(): MediaInfoKeys[] {
        return [];
    }

    override get sharedArea(): MediaInfoKeys[] {
        return ["synonyms", "genres", "artwork", "tags"];
    }

    override async info(media: IAnime | IManga): Promise<AnimeInfo | MangaInfo | undefined> {
        const mangadexId = media.mappings.find((data) => data.providerId === "mangadex")?.id;

        if (!mangadexId) return undefined;

        try {
            // Parallelize API requests
            const [mangaResponse, coversResponse] = await Promise.all([this.request(`${this.api}/manga/${mangadexId}`).then((r) => r.json()), this.request(`${this.api}/cover?limit=100&manga[]=${mangadexId}`).then((r) => r.json())]);

            const data = (mangaResponse as { data: IMangaDexManga }).data;
            const covers = coversResponse as IMangaDexCover;

            // Early return for adult content
            if (data.attributes.contentRating === "erotica" || data.attributes.contentRating === "pornographic") {
                return undefined;
            }

            // Process format once
            const formatString = data.type.toUpperCase();
            const format: MediaFormat = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

            // Process titles efficiently
            const titleEnglish = data.attributes.title[Object.keys(data.attributes.title).find((v) => v === "en") ?? ""] ?? data.attributes.altTitles.find((t) => Object.keys(t)[0] === "en")?.en ?? null;

            const titleRomaji = data.attributes.title["ja-ro"] ?? data.attributes.title["jp-ro"] ?? data.attributes.altTitles.find((t) => Object.keys(t)[0] === "ja-ro")?.["ja-ro"] ?? data.attributes.altTitles.find((t) => Object.keys(t)[0] === "jp-ro")?.["jp-ro"] ?? null;

            const titleNative =
                data.attributes.title["jp"] ??
                data.attributes.title["ja"] ??
                data.attributes.title["ko"] ??
                data.attributes.altTitles.find((t) => Object.keys(t)[0] === "jp")?.jp ??
                data.attributes.altTitles.find((t) => Object.keys(t)[0] === "ja")?.ja ??
                data.attributes.altTitles.find((t) => Object.keys(t)[0] === "ko")?.ko ??
                null;

            // Process tags once
            const processedTags = data.attributes.tags.reduce(
                (acc, tag) => {
                    const group = tag.attributes.group;
                    const name = tag.attributes.name.en;
                    if (group === "genre") acc.genres.push(name);
                    else if (group === "theme") acc.themes.push(name);
                    return acc;
                },
                { genres: [] as string[], themes: [] as string[] },
            );

            // Process artwork once
            const artwork = covers.data.map((cover) => ({
                img: `${this.url}/covers/${mangadexId}/${cover.attributes.fileName}`,
                providerId: this.id,
                type: "poster" as const,
            }));

            // Get cover art ID once
            const coverArtId = data.relationships.find((element) => element.type === "cover_art")?.id;

            return {
                id: mangadexId,
                type: media.type,
                title: {
                    english: titleEnglish,
                    romaji: titleRomaji,
                    native: titleNative,
                },
                synonyms: data.attributes.altTitles.map((title) => Object.values(title)[0]),
                description: data.attributes.description.en ?? Object.values(data.attributes.description)[0],
                countryOfOrigin: data.attributes.publicationDemographic ?? data.attributes.originalLanguage?.toUpperCase() ?? null,
                characters: [],
                genres: processedTags.genres,
                year: data.attributes.year,
                artwork,
                totalChapters: data.attributes.lastChapter ? Number(data.attributes.lastChapter) : null,
                totalVolumes: data.attributes.lastVolume ? Number(data.attributes.lastVolume) : null,
                status: data.attributes.status === "ongoing" ? MediaStatus.RELEASING : data.attributes.status === "completed" ? MediaStatus.FINISHED : data.attributes.status === "hiatus" ? MediaStatus.HIATUS : data.attributes.status === "cancelled" ? MediaStatus.CANCELLED : null,
                color: null,
                currentEpisode: null,
                duration: null,
                popularity: null,
                relations: [],
                tags: processedTags.themes,
                rating: null,
                season: MediaSeason.UNKNOWN,
                trailer: null,
                format,
                coverImage: coverArtId ? `${this.url}/covers/${mangadexId}/${coverArtId}.jpg` : null,
                bannerImage: null,
                author: data.relationships.find((element) => element.type === "author")?.attributes?.name ?? null,
                publisher: data.relationships.find((element) => element.type === "publisher")?.attributes?.name ?? null,
            } as MangaInfo;
        } catch {
            return undefined;
        }
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const media = {
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
            };

            const mangadexId = media.mappings.find((data) => data.providerId === "mangadex")?.id;

            if (!mangadexId) return undefined;

            // Parallelize API requests
            await Promise.all([this.request(`${this.api}/manga/${mangadexId}`, { proxy: proxyURL }).then((r) => r.json()), this.request(`${this.api}/cover?limit=100&manga[]=${mangadexId}`, { proxy: proxyURL }).then((r) => r.json())]);

            return true;
        } catch {
            return false;
        }
    }
}

interface IMangaDexManga {
    id: string;
    type: string;
    attributes: {
        title: {
            [key: string]: string;
        };
        altTitles: {
            [key: string]: string;
        }[];
        description: {
            [key: string]: string;
        };
        year: number;
        status: string;
        contentRating: string;
        tags: {
            attributes: {
                name: {
                    en: string;
                };
                group: string;
            };
        }[];
        publicationDemographic: string | null;
        originalLanguage: string;
        lastChapter: string | null;
        lastVolume: string | null;
    };
    relationships: {
        id: string;
        type: string;
        attributes?: {
            fileName?: string;
            name?: string;
        };
    }[];
}

interface IMangaDexCover {
    data: {
        id: string;
        attributes: {
            fileName: string;
        };
    }[];
}
