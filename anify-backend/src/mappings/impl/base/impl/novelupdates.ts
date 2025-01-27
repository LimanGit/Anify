import { type CheerioAPI, load } from "cheerio";
import BaseProvider from "..";
import { MediaFormat, MediaStatus, MediaType } from "../../../../types";
import type { AnimeInfo, MangaInfo } from "../../../../types/impl/mappings/impl/mediaInfo";
import { env } from "../../../../env";
import type { ISeasonal } from "../../../../types/impl/mappings";

/**
 * A simple in-memory cache to store getMedia responses.
 * Key: The novelupdates 'id' string
 * Value: Promise<AnimeInfo | MangaInfo | undefined>
 * This ensures that if multiple seasonal sections contain the same ID,
 * we only fetch it once.
 */
const mediaCache = new Map<string, Promise<AnimeInfo | MangaInfo | undefined>>();

export default class NovelUpdatesBase extends BaseProvider {
    override rateLimit: number = 100; // Needs a high rate limit cause bruh
    override maxConcurrentRequests: number = 7;
    override id = "novelupdates";
    override url = "https://www.novelupdates.com";

    override formats: MediaFormat[] = [MediaFormat.NOVEL];

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    private genreMappings = {
        ACTION: 8,
        ADULT: 280,
        ADVENTURE: 13,
        COMEDY: 17,
        DRAMA: 9,
        ECCHI: 292,
        FANTASY: 5,
        GENDER_BENDER: 168,
        HAREM: 3,
        HISTORICAL: 330,
        HORROR: 343,
        JOSEI: 324,
        MARTIAL_ARTS: 14,
        MATURE: 4,
        MECHA: 10,
        MYSTERY: 245,
        PSYCHOLOGICAL: 486,
        ROMANCE: 15,
        SCHOOL_LIFE: 6,
        SCI_FI: 11,
        SEINEN: 18,
        SHOUJO: 157,
        SHOUJO_AI: 851,
        SHOUNEN: 12,
        SHOUNEN_AI: 1692,
        SLICE_OF_LIFE: 7,
        SMUT: 281,
        SPORTS: 1357,
        SUPERNATURAL: 16,
        TRAGEDY: 132,
        WUXIA: 479,
        XIANXIA: 480,
        XUANHUAN: 3954,
        YAOI: 560,
        YURI: 922,
    };

    private readonly SEASONAL_ENDPOINTS = {
        trending: `${this.url}/series-ranking/?rank=month&org=496&ge=280,4,281&rl=0`,
        seasonal: `${this.url}/series-ranking/?rank=popmonth&org=496&ge=280,4,281&rl=0`,
        popular: `${this.url}/series-ranking/?rank=popular&org=496&ge=280,4,281&rl=0`,
        top: `${this.url}/series-ranking/?rank=sixmonths&org=496&ge=280,4,281&rl=0`,
    };

    private readonly MAX_RETRIES = 3;
    private readonly BATCH_SIZE = 5;

    override async search(query: string, type: MediaType, formats: MediaFormat[], page: number): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        const results: MangaInfo[] = [];

        const searchData = await this.request(`${this.url}/series-finder/?sf=1&sh=${encodeURIComponent(query)}&nt=2443,26874,2444&ge=${this.genreMappings.ADULT}&sort=sread&order=desc${page ? `&pg=${page}` : ""}`, {
            method: "GET",
            headers: {
                Referer: this.url,
                "User-Agent": "Mozilla/5.0",
            },
        });

        const data = await searchData.text();

        const $ = load(data);

        const requestPromises: Promise<void>[] = [];

        $("div.search_main_box_nu").map((_, el) => {
            const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

            requestPromises.push(
                this.getMedia(id!)
                    .then((response) => {
                        if (!response) return;
                        results.push(response as MangaInfo);
                    })
                    .catch((error) => {
                        console.error(`Error fetching data for ${id}: ${error}`);
                    }),
            );
        });

        await Promise.all(requestPromises);
        return results;
    }

    override async searchAdvanced(query: string, type: MediaType, formats: MediaFormat[], page: number, perPage: number, genres: string[] = [], genresExcluded: string[] = []): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        const results: MangaInfo[] = [];

        const genreNumbers = genres.map((genre) => this.genreMappings[genre.toUpperCase() as keyof typeof this.genreMappings]).filter((genreNumber) => genreNumber !== undefined);

        const excludedGenreNumbers = genresExcluded.map((genre) => this.genreMappings[genre.toUpperCase() as keyof typeof this.genreMappings]).filter((genreNumber) => genreNumber !== undefined);

        const searchData = await this.request(
            `${this.url}/series-finder/?sf=1&sh=${encodeURIComponent(query)}&nt=2443,26874,2444${genres.length > 0 ? `&gi=${genreNumbers.join(",")}` : ""}&ge=280${genresExcluded.length > 0 ? `,${excludedGenreNumbers.join(",")}` : ""}&sort=sread&order=desc${page ? `&pg=${page}` : ""}`,
            {
                method: "GET",
                headers: {
                    Referer: this.url,
                    "User-Agent": "Mozilla/5.0",
                },
            },
        );

        const data = await searchData.text();

        const $ = load(data);

        const requestPromises: Promise<void>[] = [];

        $("div.search_main_box_nu").map((_, el) => {
            const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

            requestPromises.push(
                this.getMedia(id!)
                    .then((response) => {
                        if (!response) return;
                        results.push(response as MangaInfo);
                    })
                    .catch((error) => {
                        console.error(`Error fetching data for ${id}: ${error}`);
                    }),
            );
        });

        await Promise.all(requestPromises);
        return results;
    }

    override async getMedia(id: string, retries = 0): Promise<AnimeInfo | MangaInfo | undefined> {
        // If already in cache, return that Promise immediately
        if (mediaCache.has(id)) {
            return await mediaCache.get(id);
        }

        // Otherwise, store a new Promise in the cache
        const fetchPromise = (async (): Promise<AnimeInfo | MangaInfo | undefined> => {
            if (retries >= 10) {
                console.error(`Failed to fetch data for ${id} after 10 retries.`);
                return undefined;
            }

            let data = await (
                await this.request(`${this.url}/series/${id}`, {
                    headers: {
                        Referer: this.url,
                        "User-Agent": "Mozilla/5.0",
                        Cookie: env.NOVELUPDATES_LOGIN ?? "",
                    },
                })
            ).text();

            let $$ = load(data);

            const title = $$("title").html();
            if (title === "Page not found - Novel Updates") {
                data = await (
                    await this.request(`${this.url}/series/${id}`, {
                        headers: {
                            Referer: this.url,
                            Origin: this.url,
                        },
                    })
                ).text();
                $$ = load(data);
            }

            if (title === "Just a moment..." || title === "Attention Required! | Cloudflare") {
                return this.getMedia(id, retries + 1);
            }

            const synonyms =
                $$("div#editassociated")
                    .html()
                    ?.split("<br>")
                    .map((item) => item.trim()) ?? [];
            const year = Number($$("div#edityear").text()?.trim() ?? 0);

            return {
                id: id ?? "",
                artwork: [],
                bannerImage: null,
                characters: [],
                color: null,
                countryOfOrigin: $$("div#showlang a").text()?.trim() ?? null,
                coverImage: $$("div.seriesimg img").attr("src") ?? null,
                description: $$("div#editdescription").text()?.trim() ?? null,
                format: MediaFormat.NOVEL,
                genres: $$("div#seriesgenre a")
                    .map((_, el) => $$(el).text())
                    .get(),
                popularity: Number($$("b.rlist").text()?.trim() ?? 0),
                rating: Number($$("h5.seriesother span.uvotes").text()?.split(" /")[0]?.substring(1) ?? 0) * 2,
                relations: [],
                status: $$("div#editstatus").text()?.includes("Complete") ? MediaStatus.FINISHED : MediaStatus.RELEASING,
                synonyms,
                tags: $$("div#showtags a")
                    .map((_, el) => $$(el).text())
                    .get(),
                title: {
                    english: $$("div.seriestitlenu").text()?.trim() ?? null,
                    native: $$("div#editassociated").html()?.split("<br>")[($$("div#editassociated").html()?.split("<br>") ?? []).length - 1]?.trim() ?? null,
                    romaji: $$("div#editassociated").html()?.split("<br>")[0]?.trim() ?? null,
                },
                totalChapters: isNaN(Number($$("div#editstatus").text()?.split(" / ")[1]?.split(" Chapters")[0]?.trim())) ? null : Number($$("div#editstatus").text()?.split(" / ")[1]?.split(" Chapters")[0]?.trim()),
                totalVolumes: isNaN(Number($$("div#editstatus").text()?.split(" / ")[0].split(" Volumes")[0]?.trim())) ? null : Number($$("div#editstatus").text()?.split(" / ")[0].split(" Volumes")[0]?.trim()),
                type: MediaType.MANGA,
                year,
                author: $$("div#showauthors a").text(),
                publisher: $$("div#showopublisher a").text(),
            };
        })();

        const media = await fetchPromise;

        mediaCache.set(id, fetchPromise);

        return media;
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
        try {
            // Process endpoints in parallel with controlled concurrency
            const results = await this.processBatchedRequests(Object.entries(this.SEASONAL_ENDPOINTS), async ([category, url]) => {
                const data = await this.fetchSeasonalData(url);
                return [category, data || []];
            });

            // Convert results array to object
            return Object.fromEntries(results) as
                | {
                      trending: ISeasonal[];
                      seasonal: ISeasonal[];
                      popular: ISeasonal[];
                      top: ISeasonal[];
                  }
                | undefined;
        } catch (error) {
            console.error("Error fetching seasonal data:", error);
            return {
                trending: [],
                seasonal: [],
                popular: [],
                top: [],
            };
        }
    }

    private async processBatchedRequests<T, R>(items: T[], processor: (item: T) => Promise<R>, batchSize = this.BATCH_SIZE): Promise<R[]> {
        const results: R[] = [];

        for (let i = 0; i < items.length; i += batchSize) {
            const batch = items.slice(i, i + batchSize);
            const batchResults = await Promise.all(batch.map((item) => processor(item)));
            results.push(...batchResults);
        }

        return results;
    }

    private async fetchSeasonalData(url: string, retries = 0): Promise<Array<ISeasonal> | undefined> {
        try {
            if (retries >= this.MAX_RETRIES) {
                console.error(`Max retries reached for ${url}`);
                return [];
            }

            const response = await this.request(url, {
                method: "GET",
                headers: {
                    Referer: this.url,
                    "User-Agent": "Mozilla/5.0",
                },
            });

            const html = await response.text();
            const $ = load(html);

            // Check for Cloudflare or error pages
            const title = $("title").html();
            if (this.isErrorPage(title)) {
                await this.delay(1000 * (retries + 1)); // Exponential backoff
                return this.fetchSeasonalData(url, retries + 1);
            }

            // Extract IDs and batch process them
            const ids = this.extractNovelIds($);
            const mediaItems = await this.processBatchedRequests(ids, async (id) => {
                try {
                    return {
                        id,
                        type: MediaType.MANGA,
                        format: MediaFormat.NOVEL,
                    };
                } catch (error) {
                    console.error(`Error fetching media for ID ${id}:`, error);
                    return null;
                }
            });

            // Filter out null results and cast to correct type
            return mediaItems.filter((item): item is AnimeInfo | MangaInfo => item !== null && item !== undefined);
        } catch (error) {
            console.error(`Error fetching seasonal data from ${url}:`, error);

            if (retries < this.MAX_RETRIES) {
                await this.delay(1000 * (retries + 1));
                return this.fetchSeasonalData(url, retries + 1);
            }

            return [];
        }
    }

    private isErrorPage(title: string | null): boolean {
        const errorTitles = ["Just a moment...", "Attention Required! | Cloudflare"];
        return errorTitles.includes(title || "");
    }

    private extractNovelIds($: CheerioAPI): string[] {
        const ids: string[] = [];

        $("div.search_main_box_nu").each((_, el) => {
            const href = $(el).find("div.search_body_nu div.search_title a").attr("href");
            const id = href?.split("/series/")[1]?.split("/")[0];
            if (id) ids.push(id);
        });

        return ids;
    }

    private delay(ms: number): Promise<void> {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: MangaInfo[] = [];

            const searchData = await this.request(`${this.url}/series-finder/?sf=1&sh=${encodeURIComponent("Mushoku Tensei")}&nt=2443,26874,2444&ge=${this.genreMappings.ADULT}&sort=sread&order=desc`, {
                method: "GET",
                headers: {
                    Referer: this.url,
                    "User-Agent": "Mozilla/5.0",
                },
                proxy: proxyURL,
            });

            const data = await searchData.text();

            const $ = load(data);

            const requestPromises: Promise<void>[] = [];

            $("div.search_main_box_nu").map((_, el) => {
                const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

                requestPromises.push(
                    this.getMedia(id!)
                        .then((response) => {
                            if (!response) return;
                            results.push(response as MangaInfo);
                        })
                        .catch((error) => {
                            console.error(`Error fetching data for ${id}: ${error}`);
                        }),
                );
            });

            await Promise.all(requestPromises);
            return results.length > 0;
        } catch {
            return false;
        }
    }
}
