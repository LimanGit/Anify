import { load } from "cheerio";
import AnimeProvider from "..";
import { type ISource, StreamingServers, SubType } from "../../../../types/impl/mappings/impl/anime";
import { type IEpisode, type IProviderResult, MediaFormat } from "../../../../types";
import { extractSource } from "../../../../video-extractors";

export default class GogoAnime extends AnimeProvider {
    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override id = "gogoanime";
    override url = "https://anitaku.bz";

    public needsProxy: boolean = false;
    public useGoogleTranslate: boolean = false;

    private ajaxURL = "https://ajax.gogocdn.net";

    override formats: MediaFormat[] = [MediaFormat.MOVIE, MediaFormat.ONA, MediaFormat.OVA, MediaFormat.SPECIAL, MediaFormat.TV, MediaFormat.TV_SHORT];

    public preferredTitle: "english" | "romaji" | "native" = "romaji";

    override get subTypes(): SubType[] {
        return [SubType.SUB, SubType.DUB];
    }

    override get headers(): Record<string, string> | undefined {
        return undefined;
    }

    override async search(query: string): Promise<IProviderResult[] | undefined> {
        const request = await this.request(`${this.url}/search.html?keyword=${encodeURIComponent(query)}`);
        if (!request.ok) {
            return [];
        }
        const data = await request.text();
        const results: IProviderResult[] = [];

        const $ = load(data);

        const promises: Promise<void>[] = [];

        $("ul.items > li").map((i, el) => {
            promises.push(
                new Promise(async (resolve) => {
                    const title = $("p.name a", el).text().trim();
                    const id = $(el).find("div.img a").attr("href")!;
                    const releasedText = $("p.released", el).text().trim();
                    const yearMatch = releasedText.match(/Released:\s+(\d{4})/);
                    const year = yearMatch ? parseInt(yearMatch[1]) : 0;
                    const img = $(el).find("div.img a img").attr("src")!;

                    const data = await this.request(`${this.url}${id}`);
                    const $$ = load(await data.text());

                    const type = $$("p.type a").attr("title");
                    const format = type === "TV Series" ? MediaFormat.TV : type === "Movie" ? MediaFormat.MOVIE : type === "Special" ? MediaFormat.SPECIAL : type === "ONA" ? MediaFormat.ONA : type === "OVA" ? MediaFormat.OVA : MediaFormat.UNKNOWN;

                    const altTitles: string[] = [];
                    const otherNames = $$("p.other-name a").attr("title")?.split(", ");
                    if (otherNames) {
                        altTitles.push(...otherNames);
                    }

                    results.push({
                        id: id,
                        title: title,
                        altTitles,
                        img: img,
                        format,
                        year: year,
                        providerId: this.id,
                    });

                    resolve();
                }),
            );
        });

        await Promise.all(promises);

        return results;
    }

    override async fetchEpisodes(id: string): Promise<IEpisode[] | undefined> {
        const episodes: IEpisode[] = [];

        const data = await (await this.request(`${this.url}${id}`)).text();

        const $ = load(data);

        const epStart = $("#episode_page > li").first().find("a").attr("ep_start");
        const epEnd = $("#episode_page > li").last().find("a").attr("ep_end");
        const movieId = $("#movie_id").attr("value");
        const alias = $("#alias_anime").attr("value");

        const req = await (await this.request(`${this.ajaxURL}/ajax/load-list-episode?ep_start=${epStart}&ep_end=${epEnd}&id=${movieId}&default_ep=${0}&alias=${alias}`)).text();

        const $$ = load(req);

        $$("#episode_related > li").each((i, el) => {
            episodes?.push({
                id: $(el).find("a").attr("href")?.trim() ?? "",
                number: parseFloat($(el).find(`div.name`).text().replace("EP ", "")),
                title: $(el).find(`div.name`).text(),
                isFiller: false,
                img: null,
                hasDub: id.includes("-dub"),
                description: null,
                rating: null,
            });
        });

        return episodes.reverse();
    }

    override async fetchSources(id: string, subType = SubType.SUB, server: StreamingServers = StreamingServers.GogoCDN): Promise<ISource | undefined> {
        if (id.startsWith("http")) {
            const serverURL = id;
            //const download = `https://gogohd.net/download${new URL(serverURL).search}`;

            const sources = await extractSource(serverURL, server ?? StreamingServers.GogoCDN);
            if (!sources) return undefined;

            sources.headers = {
                ...sources.headers,
                ...this.headers,
            };

            return sources;
        }

        const data = await (await this.request(`${this.url}${id}`)).text();

        const $ = load(data);

        let serverURL: string;

        switch (server) {
            case StreamingServers.GogoCDN:
                serverURL = `${$("#load_anime > div > div > iframe").attr("src")}`;
                break;
            case StreamingServers.VidStreaming:
                serverURL = `${$("div.anime_video_body > div.anime_muti_link > ul > li.vidcdn > a").attr("data-video")}`;
                break;
            case StreamingServers.StreamSB:
                serverURL = $("div.anime_video_body > div.anime_muti_link > ul > li.streamsb > a").attr("data-video")!;
                break;
            default:
                serverURL = `${$("#load_anime > div > div > iframe").attr("src")}`;
                break;
        }

        return await this.fetchSources(serverURL, subType, server ?? StreamingServers.GogoCDN);
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const request = await this.request(`${this.url}/search.html?keyword=${encodeURIComponent("Mushoku Tensei")}`, {
                proxy: proxyURL,
            });

            const data = await request.text();
            const results: IProviderResult[] = [];

            const $ = load(data);

            $("ul.items > li").map((i, el) => {
                const title = $("p.name a", el).text().trim();
                const id = $(el).find("div.img a").attr("href")!;
                const releasedText = $("p.released", el).text().trim();
                const yearMatch = releasedText.match(/Released:\s+(\d{4})/);
                const year = yearMatch ? parseInt(yearMatch[1]) : 0;
                const img = $(el).find("div.img a img").attr("src")!;

                const format: MediaFormat = MediaFormat.UNKNOWN;

                results.push({
                    id: id,
                    title: title,
                    altTitles: [],
                    img: img,
                    format,
                    year: year,
                    providerId: this.id,
                });
            });

            return results.length > 0;
        } catch {
            return false;
        }
    }
}
