import BaseProvider from "..";
import { MediaFormat, MediaSeason, MediaStatus, MediaType } from "../../../../types";
import type { ISeasonal } from "../../../../types/impl/mappings";
import type { AnimeInfo, MangaInfo } from "../../../../types/impl/mappings/impl/mediaInfo";

export default class MangaDexBase extends BaseProvider {
    override rateLimit: number = 0;
    override maxConcurrentRequests: number = -1;
    override id = "mangadex";
    override url = "https://mangadex.org";

    override formats: MediaFormat[] = [MediaFormat.MANGA, MediaFormat.ONE_SHOT];

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = true;

    private api = "https://api.mangadex.org";

    override async search(query: string, type: MediaType, formats: MediaFormat[], page: number, perPage: number): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        const results: MangaInfo[] = [];
        const limit = !perPage || perPage === 0 ? 25 : perPage;
        const offset = limit * (page || 0);

        // Build URL with all params at once
        const uri = new URL("/manga", this.api);
        uri.searchParams.set("title", query);
        uri.searchParams.set("limit", String(limit * 2)); // Get 2 pages worth in one request
        uri.searchParams.set("offset", String(offset));
        uri.searchParams.set("order[relevance]", "desc");
        uri.searchParams.append("contentRating[]", "safe");
        uri.searchParams.append("contentRating[]", "suggestive");
        uri.searchParams.append("includes[]", "cover_art");

        const { data: mangaList = [] } = (await (await this.request(uri.href)).json()) as { data: IManga[] };

        for (const manga of mangaList) {
            const { attributes, relationships, id, type: mangaType } = manga;
            const { title, altTitles, year, description, status, tags, publicationDemographic, originalLanguage, lastChapter, lastVolume } = attributes;

            // Find cover art relationship once
            const coverArtId = relationships.find((element) => element.type === "cover_art")?.id;
            const img = coverArtId ? `${this.url}/covers/${id}/${coverArtId}.jpg.512.jpg` : null;

            // Process titles once
            const titleEnglish = altTitles.find((t) => Object.keys(t)[0] === "en")?.en ?? title[Object.keys(title).find((v) => v === "en") ?? ""] ?? null;
            const titleRomaji = title["ja-ro"] ?? title["jp-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "ja-ro")?.["ja-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp-ro")?.["jp-ro"] ?? null;
            const titleNative = title["jp"] ?? title["ja"] ?? title["ko"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp")?.jp ?? altTitles.find((t) => Object.keys(t)[0] === "ja")?.ja ?? altTitles.find((t) => Object.keys(t)[0] === "ko")?.ko ?? null;

            // Process format once
            const formatString = mangaType.toUpperCase();
            const format = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

            // Process tags once
            const genreTags = tags.filter((tag) => tag.attributes.group === "genre");
            const themeTags = tags.filter((tag) => tag.attributes.group === "theme");

            results.push({
                id,
                title: {
                    english: titleEnglish,
                    romaji: titleRomaji,
                    native: titleNative,
                },
                synonyms: [...altTitles.map((title) => Object.values(title)[0]), ...Object.values(title)],
                coverImage: img,
                format,
                year,
                artwork: [],
                bannerImage: null,
                characters: [],
                color: null,
                countryOfOrigin: publicationDemographic ?? originalLanguage?.toUpperCase() ?? null,
                description: description.en ?? Object.values(description)[0],
                genres: genreTags.map((tag) => tag.attributes.name.en),
                totalChapters: Number(lastChapter) ?? null,
                totalVolumes: Number(lastVolume) ?? null,
                status: status === "ongoing" ? MediaStatus.RELEASING : status === "completed" ? MediaStatus.FINISHED : status === "hiatus" ? MediaStatus.HIATUS : status === "cancelled" ? MediaStatus.CANCELLED : null,
                tags: themeTags.map((tag) => tag.attributes.name.en),
                popularity: null,
                relations: [],
                rating: null,
                type: MediaType.MANGA,
                author: null,
                publisher: null,
            });
        }

        return results;
    }

    override async searchAdvanced(
        query: string,
        type: MediaType,
        formats: MediaFormat[],
        page: number,
        perPage: number,
        genres?: string[],
        genresExcluded?: string[],
        season?: MediaSeason,
        year: number = 0,
        tags: string[] = [],
        tagsExcluded: string[] = [],
    ): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        const results: MangaInfo[] = [];
        const limit = !perPage || perPage === 0 ? 25 : perPage;
        const offset = limit * (page || 0);

        // Fetch tags only if needed
        const genreList: { name: string; uid: string }[] = [];
        const tagList: { name: string; uid: string }[] = [];

        if ((tags?.length ?? 0) > 0 || (tagsExcluded?.length ?? 0) > 0 || (genres?.length ?? 0) > 0 || (genresExcluded?.length ?? 0) > 0) {
            const { data: tagData = [] } = (await (await this.request(`${this.api}/manga/tag`)).json()) as { data: IMangaTag[] };

            // Process tags once
            for (const item of tagData) {
                const { attributes, id } = item;
                if (!attributes) continue;

                const tagInfo = {
                    name: attributes.name?.en,
                    uid: id,
                };

                if (attributes.group === "genre") {
                    genreList.push(tagInfo);
                    tagList.push(tagInfo);
                } else if (attributes.group === "theme") {
                    tagList.push(tagInfo);
                }
            }
        }

        // Build URL with all params at once
        const uri = new URL("/manga", this.api);
        uri.searchParams.set("title", query);
        uri.searchParams.set("limit", String(limit * 2)); // Get 2 pages worth in one request
        uri.searchParams.set("offset", String(offset));
        uri.searchParams.set("order[relevance]", "desc");
        uri.searchParams.append("contentRating[]", "safe");
        uri.searchParams.append("contentRating[]", "suggestive");
        uri.searchParams.append("includes[]", "cover_art");

        if (year) {
            uri.searchParams.set("year", String(year));
        }

        // Process included/excluded tags efficiently
        const processTagList = (items: string[] = [], list: typeof tagList, paramName: string) => {
            const tagIds = items.map((item) => list.find((t) => t.name === item)?.uid).filter(Boolean);

            if (tagIds.length > 0) {
                uri.searchParams.append(paramName, tagIds.join(","));
                return true;
            }
            return false;
        };

        const hasIncludedGenres = processTagList(genres, genreList, "includedTags[]");
        processTagList(genresExcluded, genreList, "excludedTags[]");
        const hasIncludedTags = processTagList(tags, tagList, "includedTags[]");
        processTagList(tagsExcluded, tagList, "excludedTags[]");

        if (hasIncludedGenres || hasIncludedTags) {
            uri.searchParams.set("includedTagsMode", "AND");
        }

        const { data: mangaList = [] } = (await (await this.request(uri.href)).json()) as { data: IManga[] };

        for (const manga of mangaList) {
            const { attributes, relationships, id, type: mangaType } = manga;
            const { title, altTitles, year, description, status, tags, publicationDemographic, originalLanguage, lastChapter, lastVolume } = attributes;

            // Find cover art relationship once
            const coverArtId = relationships.find((element) => element.type === "cover_art")?.id;
            const img = coverArtId ? `${this.url}/covers/${id}/${coverArtId}.jpg.512.jpg` : null;

            // Process titles once
            const titleEnglish = altTitles.find((t) => Object.keys(t)[0] === "en")?.en ?? title[Object.keys(title).find((v) => v === "en") ?? ""] ?? null;
            const titleRomaji = title["ja-ro"] ?? title["jp-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "ja-ro")?.["ja-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp-ro")?.["jp-ro"] ?? null;
            const titleNative = title["jp"] ?? title["ja"] ?? title["ko"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp")?.jp ?? altTitles.find((t) => Object.keys(t)[0] === "ja")?.ja ?? altTitles.find((t) => Object.keys(t)[0] === "ko")?.ko ?? null;

            // Process format once
            const formatString = mangaType.toUpperCase();
            const format = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

            // Process tags once
            const genreTags = tags.filter((tag) => tag.attributes.group === "genre");
            const themeTags = tags.filter((tag) => tag.attributes.group === "theme");

            results.push({
                id,
                title: {
                    english: titleEnglish,
                    romaji: titleRomaji,
                    native: titleNative,
                },
                synonyms: [...altTitles.map((title) => Object.values(title)[0]), ...Object.values(title)],
                coverImage: img,
                format,
                year,
                artwork: [],
                bannerImage: null,
                characters: [],
                color: null,
                countryOfOrigin: publicationDemographic ?? originalLanguage?.toUpperCase() ?? null,
                description: description.en ?? Object.values(description)[0],
                genres: genreTags.map((tag) => tag.attributes.name.en),
                totalChapters: Number(lastChapter) ?? null,
                totalVolumes: Number(lastVolume) ?? null,
                status: status === "ongoing" ? MediaStatus.RELEASING : status === "completed" ? MediaStatus.FINISHED : status === "hiatus" ? MediaStatus.HIATUS : status === "cancelled" ? MediaStatus.CANCELLED : null,
                tags: themeTags.map((tag) => tag.attributes.name.en),
                popularity: null,
                relations: [],
                rating: null,
                type: MediaType.MANGA,
                author: null,
                publisher: null,
            });
        }

        return results;
    }

    override getCurrentSeason(): MediaSeason {
        const month = new Date().getMonth();

        if ((month >= 0 && month <= 1) || month === 11) {
            return MediaSeason.WINTER;
        } else if (month >= 2 && month <= 4) {
            return MediaSeason.SPRING;
        } else if (month >= 5 && month <= 7) {
            return MediaSeason.SUMMER;
        } else {
            return MediaSeason.FALL;
        }
    }

    override async getMedia(id: string): Promise<AnimeInfo | MangaInfo | undefined> {
        try {
            // Parallelize API requests
            const [mangaResponse, coversResponse] = await Promise.all([this.request(`${this.api}/manga/${id}`).then((r) => r.json()), this.request(`${this.api}/cover?limit=100&manga[]=${id}`).then((r) => r.json())]);

            const data = (mangaResponse as { data: IManga }).data;
            const covers = coversResponse as { data: ICover[] };

            // Early return for adult content
            if (data.attributes.contentRating === "erotica" || data.attributes.contentRating === "pornographic") {
                return undefined;
            }

            const { attributes, relationships } = data;
            const { title, altTitles, description, tags, year, status, lastChapter, lastVolume, originalLanguage, publicationDemographic } = attributes;

            // Process format once
            const formatString = data.type.toUpperCase();
            const format = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

            // Process titles efficiently
            const titleEnglish = altTitles.find((t) => Object.keys(t)[0] === "en")?.en ?? title[Object.keys(title).find((v) => v === "en") ?? ""] ?? null;

            const titleRomaji = title["ja-ro"] ?? title["jp-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "ja-ro")?.["ja-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp-ro")?.["jp-ro"] ?? null;

            const titleNative = title["jp"] ?? title["ja"] ?? title["ko"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp")?.jp ?? altTitles.find((t) => Object.keys(t)[0] === "ja")?.ja ?? altTitles.find((t) => Object.keys(t)[0] === "ko")?.ko ?? null;

            // Process tags once
            const processedTags = tags.reduce(
                (acc, tag) => {
                    const group = tag.attributes.group;
                    const name = tag.attributes.name.en;
                    if (group === "genre") acc.genres.push(name);
                    else if (group === "theme") acc.themes.push(name);
                    return acc;
                },
                { genres: [] as string[], themes: [] as string[] },
            );

            // Get cover art ID once
            const coverArtId = relationships.find((element) => element.type === "cover_art")?.id;

            // Process artwork once
            const artwork = covers.data.map((cover) => ({
                img: `${this.url}/covers/${id}/${cover.attributes.fileName}`,
                providerId: this.id,
                type: "poster" as const,
            }));

            return {
                id,
                title: {
                    english: titleEnglish,
                    romaji: titleRomaji,
                    native: titleNative,
                },
                synonyms: [...altTitles.map((title) => Object.values(title)[0]), ...Object.values(title)],
                coverImage: coverArtId ? `${this.url}/covers/${id}/${coverArtId}.jpg.512.jpg` : null,
                format,
                year,
                artwork,
                bannerImage: null,
                characters: [],
                color: null,
                countryOfOrigin: publicationDemographic ?? originalLanguage?.toUpperCase() ?? null,
                description: description.en ?? Object.values(description)[0],
                genres: processedTags.genres,
                totalChapters: Number(lastChapter) ?? null,
                totalVolumes: Number(lastVolume) ?? null,
                status: status === "ongoing" ? MediaStatus.RELEASING : status === "completed" ? MediaStatus.FINISHED : status === "hiatus" ? MediaStatus.HIATUS : status === "cancelled" ? MediaStatus.CANCELLED : null,
                tags: processedTags.themes,
                popularity: null,
                relations: [],
                rating: null,
                type: MediaType.MANGA,
                author: null,
                publisher: null,
            };
        } catch {
            return undefined;
        }
    }

    override async fetchSeasonal(): Promise<
        | {
              trending: ISeasonal[];
              seasonal: ISeasonal[];
              popular: ISeasonal[];
              top: ISeasonal[];
          }
        | undefined
    > {
        // Format the date as YYYY-MM-DD
        const currentDate = new Date(Date.now());
        currentDate.setDate(currentDate.getDate() - 3);

        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const day = currentDate.getDate().toString().padStart(2, "0");

        const createdAtParam = `${year}-${month}-${day}T00:00:00`;

        // Fetch seasonal list first to get IDs
        const seasonalReq = (await this.request(`${this.api}/list/1b9f88f8-9880-464d-9ed9-59b7e36392e2?includes[]=user`)
            .then((r) => r.json())
            .catch(() => ({ data: [] }))) as { data: IMangaList };

        const seasonalIDs: string[] = seasonalReq.data.relationships.filter((item) => item.type === "manga").map((item) => item.id);

        // Prepare all API requests
        const requests = [
            this.request(`${this.api}/manga?includes[]=cover_art&includes[]=artist&includes[]=author&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true&createdAtSince=${createdAtParam}`)
                .then((r) => r.json())
                .catch(() => ({ data: [] })),
            this.request(`${this.api}/manga?includes[]=cover_art&includes[]=artist&includes[]=author&order[followedCount]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`)
                .then((r) => r.json())
                .catch(() => ({ data: [] })),
            this.request(`${this.api}/manga?includes[]=cover_art&includes[]=artist&includes[]=author&order[rating]=desc&contentRating[]=safe&contentRating[]=suggestive&hasAvailableChapters=true`)
                .then((r) => r.json())
                .catch(() => ({ data: [] })),
            seasonalIDs.length > 0
                ? this.request(`${this.api}/manga?includes[]=cover_art&includes[]=artist&includes[]=author&ids[]=${seasonalIDs.join("&ids[]=")}`)
                      .then((r) => r.json())
                      .catch(() => ({ data: [] }))
                : Promise.resolve({ data: [] }),
        ];

        // Execute all requests in parallel
        const [trending, popular, top, seasonal] = (await Promise.all(requests)) as [{ data: IManga[] }, { data: IManga[] }, { data: IManga[] }, { data: IManga[] }];

        // Process results in parallel using map
        const [trendingList, popularList, topList, seasonalList] = await Promise.all([
            trending.data.map((manga) => this.returnFilledManga(manga)),
            popular.data.map((manga) => this.returnFilledManga(manga)),
            top.data.map((manga) => this.returnFilledManga(manga)),
            seasonal.data.map((manga) => this.returnFilledManga(manga)),
        ]);

        return {
            trending: trendingList,
            seasonal: seasonalList,
            popular: popularList,
            top: topList,
        };
    }

    override async fetchIds(): Promise<string[] | undefined> {
        const data = (await (await fetch("https://raw.githubusercontent.com/ArdaxHz/mangadex-id-map/main/json/manga_map.json")).json()) as { [key: string]: string };
        /*
        {
            "1": "c0ee660b-f9f2-45c3-8068-5123ff53f84a",
            "2": "7dbeaa0e-420a-4dc0-b2d3-eb174de266da",
            ...
        }
        */
        const ids: string[] = [];
        for (const id in data) {
            ids.push(String(data[id]));
        }

        return ids;
    }

    private returnFilledManga(manga: IManga): ISeasonal {
        const formatString: string = manga.type.toUpperCase();
        const format: MediaFormat = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

        return {
            id: manga.id,
            type: MediaType.MANGA,
            format,
        };
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: MangaInfo[] = [];
            const limit = 25;
            const page = 0;
            const offset = limit * page;

            // Build URL with all params at once
            const uri = new URL("/manga", this.api);
            uri.searchParams.set("title", "Mushoku Tensei");
            uri.searchParams.set("limit", String(limit * 2)); // Get 2 pages worth in one request
            uri.searchParams.set("offset", String(offset));
            uri.searchParams.set("order[relevance]", "desc");
            uri.searchParams.append("contentRating[]", "safe");
            uri.searchParams.append("contentRating[]", "suggestive");
            uri.searchParams.append("includes[]", "cover_art");

            const { data: mangaList = [] } = (await (
                await this.request(uri.href, {
                    proxy: proxyURL,
                })
            ).json()) as { data: IManga[] };

            for (const manga of mangaList) {
                const { attributes, relationships, id, type: mangaType } = manga;
                const { title, altTitles, year, description, status, tags, publicationDemographic, originalLanguage, lastChapter, lastVolume } = attributes;

                // Find cover art relationship once
                const coverArtId = relationships.find((element) => element.type === "cover_art")?.id;
                const img = coverArtId ? `${this.url}/covers/${id}/${coverArtId}.jpg.512.jpg` : null;

                // Process titles once
                const titleEnglish = altTitles.find((t) => Object.keys(t)[0] === "en")?.en ?? title[Object.keys(title).find((v) => v === "en") ?? ""] ?? null;
                const titleRomaji = title["ja-ro"] ?? title["jp-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "ja-ro")?.["ja-ro"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp-ro")?.["jp-ro"] ?? null;
                const titleNative = title["jp"] ?? title["ja"] ?? title["ko"] ?? altTitles.find((t) => Object.keys(t)[0] === "jp")?.jp ?? altTitles.find((t) => Object.keys(t)[0] === "ja")?.ja ?? altTitles.find((t) => Object.keys(t)[0] === "ko")?.ko ?? null;

                // Process format once
                const formatString = mangaType.toUpperCase();
                const format = formatString === "ADAPTATION" ? MediaFormat.MANGA : Object.values(MediaFormat).includes(formatString as MediaFormat) ? (formatString as MediaFormat) : MediaFormat.MANGA;

                // Process tags once
                const genreTags = tags.filter((tag) => tag.attributes.group === "genre");
                const themeTags = tags.filter((tag) => tag.attributes.group === "theme");

                results.push({
                    id,
                    title: {
                        english: titleEnglish,
                        romaji: titleRomaji,
                        native: titleNative,
                    },
                    synonyms: [...altTitles.map((title) => Object.values(title)[0]), ...Object.values(title)],
                    coverImage: img,
                    format,
                    year,
                    artwork: [],
                    bannerImage: null,
                    characters: [],
                    color: null,
                    countryOfOrigin: publicationDemographic ?? originalLanguage?.toUpperCase() ?? null,
                    description: description.en ?? Object.values(description)[0],
                    genres: genreTags.map((tag) => tag.attributes.name.en),
                    totalChapters: Number(lastChapter) ?? null,
                    totalVolumes: Number(lastVolume) ?? null,
                    status: status === "ongoing" ? MediaStatus.RELEASING : status === "completed" ? MediaStatus.FINISHED : status === "hiatus" ? MediaStatus.HIATUS : status === "cancelled" ? MediaStatus.CANCELLED : null,
                    tags: themeTags.map((tag) => tag.attributes.name.en),
                    popularity: null,
                    relations: [],
                    rating: null,
                    type: MediaType.MANGA,
                    author: null,
                    publisher: null,
                });
            }

            return results.length > 0;
        } catch {
            return false;
        }
    }
}

interface IManga {
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
        isLocked: boolean;
        links: {
            [key: string]: string;
        };
        originalLanguage: string;
        lastVolume: string;
        lastChapter: string;
        publicationDemographic: string;
        status: string;
        year: number;
        contentRating: string;
        tags: {
            id: string;
            type: string;
            attributes: {
                name: {
                    en: string;
                };
                description: {
                    [key: string]: string;
                };
                group: string;
                version: number;
            };
            relationships: {
                id: string;
                type: string;
                related: string;
                attributes: {
                    [key: string]: string;
                };
            }[];
        }[];
        state: string;
        chapterNumbersResetOnNewVolume: boolean;
        createdAt: string;
        updatedAt: string;
        version: number;
        availableTranslatedLanguages: string[];
        latestUploadedChapter: string;
    };
    relationships: {
        id: string;
        type: string;
        related?: string;
        attributes?: {
            description: string;
            volume: string;
            fileName: string;
            locale: string;
            createdAt: string;
            updatedAt: string;
            version: number;
        };
    }[];
}

interface IMangaTag {
    id: string;
    type: string;
    attributes: {
        name: {
            [key: string]: string;
        };
        description: {
            [key: string]: string;
        };
        group: string;
        version: number;
    };
    relationships: {
        id: string;
        type: string;
        related: string;
    }[];
}

interface ICover {
    id: string;
    type: string;
    attributes: {
        description: string;
        volume: string;
        fileName: string;
        locale: string;
        createdAt: string;
        updatedAt: string;
        version: number;
    };
}
interface IMangaList {
    id: string;
    attributes: {
        name: string;
        visibility: string;
        version: number;
    };
    relationships: {
        id: string;
        type: string;
        attributes?: {
            username: string;
            roles: string[];
            version: number;
        };
    }[];
}
