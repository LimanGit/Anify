import { load } from "cheerio";
import InformationProvider from "..";
import type { IAnime } from "../../../../types/impl/database/impl/schema/anime";
import type { IManga } from "../../../../types/impl/database/impl/schema/manga";
import type { AnimeInfo, MangaInfo, MediaInfoKeys } from "../../../../types/impl/mappings/impl/mediaInfo";
import type { ICharacter } from "../../../../types/impl/database/impl/mappings";
import { type IChapter, type IEpisode, MediaFormat, MediaSeason, MediaStatus, MediaType, ProviderType } from "../../../../types";

export default class AniDB extends InformationProvider<IAnime | IManga, AnimeInfo | MangaInfo> {
    override id = "anidb";
    override url = "https://anidb.net";

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    override rateLimit: number = 0;
    override maxConcurrentRequests: number = -1;
    override formats: MediaFormat[] = [MediaFormat.TV, MediaFormat.MOVIE, MediaFormat.ONA, MediaFormat.SPECIAL, MediaFormat.TV_SHORT, MediaFormat.OVA];

    override get priorityArea(): MediaInfoKeys[] {
        return [];
    }

    override get sharedArea(): MediaInfoKeys[] {
        return ["synonyms", "genres", "tags"];
    }

    override async info(media: IAnime | IManga): Promise<AnimeInfo | MangaInfo | undefined> {
        const aniDbId = media.mappings.find((data) => {
            return data.providerId === "anidb";
        })?.id;

        if (!aniDbId) return undefined;

        const data = await (
            await this.request(`${this.url}${aniDbId}`, {
                headers: {
                    "User-Agent": "Anify",
                },
            })
        ).text();

        const $ = load(data);

        const characters: ICharacter[] = [];

        $("div#characterlist div.character div.column div.g_bubble").map((_, el) => {
            characters.push({
                image: $(el).find("div.thumb img").attr("src") ?? "",
                name: $(el).find("div.data div.name a.name-colored span").text()?.trim(),
                voiceActor: {
                    image: "",
                    name: $("div.info div.seiyuu span.name a.primary span").first().text()?.trim(),
                },
            });
        });

        $("div#characterlist div.cast div.column div.g_bubble").map((_, el) => {
            characters.push({
                image: $(el).find("div.thumb img").attr("src") ?? "",
                name: $(el).find("div.data div.name a.name-colored span").text()?.trim(),
                voiceActor: {
                    image: "",
                    name: $("div.info div.seiyuu span.name a.primary span").first().text()?.trim(),
                },
            });
        });

        const dateString = $("div.info div.data tr.year td.value span").first()?.text().trim();
        const [day, month, year] = dateString.split(".");
        const date = new Date(`${year}-${month}-${day}`);

        const finalDate = $("div.info div.data tr.year td.value span").last()?.text();

        const totalEpisodes = isNaN(Number($("div.info tr.type td.value span").html())) ? null : Number($("div.info tr.type td.value span").html());

        const runningTimeText = $("div.stats div.container div.duration div.val").text().trim();
        const runningTime = runningTimeText.includes("h") ? Number(runningTimeText.split(" ")[1]?.slice(0, -1)) * 60 : Number(runningTimeText.split(" ")[1]?.slice(0, -1));

        const duration = totalEpisodes ? runningTime / totalEpisodes : null;

        const genres = $("div.info div.data tr.tags td.value span.g_tag")
            .map((_, el) => $(el).find("span.tagname").text().trim())
            .get();

        return {
            id: aniDbId,
            type: media.type,
            year: date.getFullYear(),
            trailer: null,
            status: finalDate.includes("?") ? MediaStatus.RELEASING : MediaStatus.FINISHED,
            totalEpisodes: totalEpisodes,
            totalChapters: null,
            totalVolumes: null,
            title: {
                english: $("div.info div.titles tr.official").first()?.find("td.value label").text(),
                romaji: $("div.info div.titles tr.romaji td.value span").text(),
                native: $("div.info div.titles tr.official").last()?.find("td.value label").text(),
            },
            synonyms:
                $("div.info div.titles tr.syn td.value")
                    .text()
                    ?.split(", ")
                    .map((data) => data.trim())
                    .concat($("div.titles tr.short td.value").text()) ?? [],
            tags: [],
            coverImage: $("div.info div.image div.container img").attr("src") ?? null,
            bannerImage: null,
            characters,
            season: $("div.info tr.season td.value a").text()?.split(" ")[0].toUpperCase().replace(/"/g, "") as MediaSeason,
            countryOfOrigin: null,
            relations: [],
            rating: Number($("div.info tr.rating td.value a span.value").text() ?? 0),
            popularity: Number($("div.info tr.rating td.value span.count").attr("content") ?? 0),
            artwork: [],
            color: null,
            currentEpisode: null,
            description: $("div.desc").text()?.trim(),
            duration,
            format: MediaFormat.UNKNOWN,
            genres,
        } as AnimeInfo;
    }

    override async fetchContentData(media: IAnime | IManga): Promise<IEpisode[] | IChapter[] | undefined> {
        const aniDbId = media.mappings.find((data) => {
            return data.providerId === "anidb";
        })?.id;

        if (!aniDbId) return undefined;

        const data = await (
            await this.request(`${this.url}${aniDbId}`, {
                headers: {
                    "User-Agent": "Anify",
                },
            })
        ).text();

        const $ = load(data);

        const episodeList: {
            id: string;
            title: string;
            number: number;
            duration: string;
            airDate: number;
        }[] = [];

        $("div.episodes table#eplist tr").map((i, el) => {
            if ($(el).find("td.id a abbr").attr("title") === "Regular Episode") {
                episodeList.push({
                    id: $(el).find("td.id a").attr("href") ?? "",
                    number: Number($(el).find("td.id").text()),
                    title: $(el).find("td.episode label").text()?.trim() ?? "", // The title attribute contains synonyms
                    duration: $(el).find("td.duration").text(),
                    airDate: new Date($(el).find("td.date").attr("content") ?? "").getTime(),
                });
            }
        });

        const episodePromises = episodeList.map((episode) => this.fetchEpisodeData(episode));

        const episodes = (await Promise.all(episodePromises)) as (IEpisode | undefined)[];

        return episodes.filter((episode) => episode !== undefined) as IEpisode[];
    }

    private async fetchEpisodeData(episode: { id: string; title: string; number: number; duration: string; airDate: number }): Promise<IEpisode | undefined> {
        try {
            const response = await (await this.request(`${this.url}${episode.id}`)).text();
            const $ = load(response);

            const description = $("div.desc div.summary").text()?.trim() || null;
            const rating = Number($("div.info tr.rating td.value a span.value").text());

            return {
                id: episode.id,
                description,
                hasDub: false,
                img: null,
                isFiller: false,
                number: episode.number,
                rating,
                title: episode.title,
                updatedAt: isNaN(new Date($("div.info tr.date td.value span").text()?.trim() || "").getTime()) ? undefined : new Date($("div.info tr.date td.value span").text()?.trim() || "").getTime(),
            };
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
                        id: "/anime/69",
                        providerId: "anidb",
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
            };
            const aniDbId = media.mappings.find((data) => {
                return data.providerId === "anidb";
            })?.id;

            if (!aniDbId) return undefined;

            await (
                await this.request(`${this.url}${aniDbId}`, {
                    headers: {
                        "User-Agent": "Anify",
                    },
                    proxy: proxyURL,
                })
            ).text();

            return true;
        } catch {
            return false;
        }
    }
}
