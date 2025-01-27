import { load } from "cheerio";
import MetaProvider from "..";
import { IProviderResult, MediaFormat, MediaType } from "../../../../types";
import type { IRequestConfig } from "../../../../types/impl/proxies";

export default class MALMeta extends MetaProvider {
    override id = "mal";
    override url = "https://myanimelist.net";

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override formats: MediaFormat[] = [MediaFormat.TV, MediaFormat.MOVIE, MediaFormat.ONA, MediaFormat.SPECIAL, MediaFormat.TV_SHORT, MediaFormat.OVA, MediaFormat.MANGA, MediaFormat.ONE_SHOT, MediaFormat.NOVEL];

    override async search(query: string): Promise<IProviderResult[] | undefined> {
        const results: IProviderResult[] = [];

        const anime = await this.fetchResults(query, MediaType.ANIME);
        const manga = await this.fetchResults(query, MediaType.MANGA);

        if (anime) {
            results.push(...anime);
        }

        if (manga) {
            results.push(...manga);
        }

        return results;
    }

    private async fetchResults(query: string, type: MediaType, proxyURL?: string): Promise<IProviderResult[] | undefined> {
        const results: IProviderResult[] = [];

        const requestConfig: IRequestConfig = {};
        if (proxyURL) {
            requestConfig.proxy = proxyURL;
        }

        const url = `${this.url}/${type === MediaType.ANIME ? "anime" : "manga"}.php?q=${query}&c[]=a&c[]=b&c[]=c&c[]=f&c[]=d&c[]=e&c[]=g`;
        const data = await (await this.request(url, requestConfig)).text();
        const $ = load(data);

        const searchResults = $("div.js-categories-seasonal table tr").first();

        if (!searchResults.length) {
            return undefined;
        }

        const promises: Promise<void>[] = [];

        searchResults.nextAll().map((_, el) => {
            const id = $("td:nth-child(1) div a", el).attr("id")?.split("sarea")[1] ?? "";
            const title = $("td:nth-child(2) a strong", el).text();
            const img = $("td:nth-child(1) div a img", el).attr("data-src") ?? "";
            const format = $("td:nth-child(3)", el).text()?.trim() ?? "";

            const date = $("td:nth-child(6)", el).text()?.trim();

            promises.push(
                new Promise(async (resolve) => {
                    const data = await (await this.request(`${this.url}/${type === MediaType.ANIME ? "anime" : "manga"}/${id}`, requestConfig)).text();
                    const $$ = load(data);

                    const published =
                        $$("span:contains('Published:')").length > 0
                            ? $$("span:contains('Published:')").parents().first().text().replace($$("span:contains('Published:')").first().text(), "").replace(/\s+/g, " ").trim() === "?"
                                ? null
                                : $$("span:contains('Published:')").parents().first().text().replace($$("span:contains('Published:')").first().text(), "").replace(/\s+/g, " ").trim()
                            : null;
                    const premiered =
                        $$("span:contains('Premiered:')").length > 0
                            ? $$("span:contains('Premiered:')").parents().first().text().replace($$("span:contains('Premiered:')").first().text(), "").replace(/\s+/g, " ").trim() === "?"
                                ? null
                                : $$("span:contains('Premiered:')").parents().first().text().replace($$("span:contains('Premiered:')").first().text(), "").replace(/\s+/g, " ").trim()
                            : null;

                    const year =
                        type === MediaType.ANIME
                            ? Number.isNaN(date === "-" ? 0 : new Date(date).getFullYear())
                                ? premiered
                                    ? parseInt(premiered.split(" ")[1]?.split(" ")[0], 10)
                                    : null
                                : date === "-"
                                  ? 0
                                  : new Date(date).getFullYear()
                            : Number.isNaN(date === "-" ? 0 : new Date(date).getFullYear())
                              ? published
                                  ? new Date(published.split(" to")[0]).getFullYear()
                                  : null
                              : date === "-"
                                ? 0
                                : new Date(date).getFullYear();

                    const alternativeTitlesDiv = $$("h2:contains('Alternative Titles')").nextUntil("h2:contains('Information')").first();
                    const additionalTitles = alternativeTitlesDiv
                        .find("div.spaceit_pad")
                        .map((_, item) => {
                            return $$(item).text().trim();
                        })
                        .get();
                    const titles = {
                        main: $$("meta[property='og:title']").attr("content") || "",
                        english: $$("span:contains('English:')").length > 0 ? $$("span:contains('English:')").parent().text().replace($$("span:contains('English:')").text(), "").replace(/\s+/g, " ").trim() : null,
                        synonyms: $$("span:contains('Synonyms:')").length > 0 ? $$("span:contains('Synonyms:')").parent().text().replace($$("span:contains('Synonyms:')").text(), "").replace(/\s+/g, " ").trim().split(", ") : [],
                        japanese: $$("span:contains('Japanese:')").length > 0 ? $$("span:contains('Japanese:')").parent().text().replace($$("span:contains('Japanese:')").text(), "").replace(/\s+/g, " ").trim() : null,
                        alternatives: additionalTitles,
                    };

                    const altTitles = [titles.main, titles.english, titles.japanese, ...titles.synonyms, ...titles.alternatives].filter((x) => x !== null && x !== undefined && x !== "");

                    results.push({
                        id,
                        title,
                        altTitles: altTitles as string[],
                        year: year ?? 0,
                        format:
                            format === "Music"
                                ? MediaFormat.MUSIC
                                : format === "TV"
                                  ? MediaFormat.TV
                                  : format === "Movie"
                                    ? MediaFormat.MOVIE
                                    : format === "TV Short"
                                      ? MediaFormat.TV_SHORT
                                      : format === "OVA"
                                        ? MediaFormat.OVA
                                        : format === "ONA"
                                          ? MediaFormat.ONA
                                          : format === "Manga"
                                            ? MediaFormat.MANGA
                                            : format === "One-shot"
                                              ? MediaFormat.ONE_SHOT
                                              : format === "Doujinshi"
                                                ? MediaFormat.MANGA
                                                : format === "Light Novel"
                                                  ? MediaFormat.NOVEL
                                                  : format === "Novel"
                                                    ? MediaFormat.NOVEL
                                                    : format === "Special"
                                                      ? MediaFormat.SPECIAL
                                                      : format === "TV Special"
                                                        ? MediaFormat.TV_SHORT
                                                        : format === "Manhwa"
                                                          ? MediaFormat.MANGA
                                                          : format === "Manhua"
                                                            ? MediaFormat.MANGA
                                                            : MediaFormat.UNKNOWN,
                        img,
                        providerId: this.id,
                    });

                    resolve();
                }),
            );
        });

        await Promise.all(promises);

        return results;
    }

    private async fetchForProxyCheck(proxyURL: string): Promise<boolean> {
        const requestConfig: IRequestConfig = {
            proxy: proxyURL,
            isChecking: true,
        };

        try {
            const url = `${this.url}/anime.php?q=Mushoku%20Tensei`;
            const response = await this.request(url, requestConfig);
            const data = await response.text();
            const $ = load(data);

            // Just check if we can find any search results
            return $("div.js-categories-seasonal table tr").length > 0;
        } catch {
            return false;
        }
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            return await this.fetchForProxyCheck(proxyURL);
        } catch {
            return false;
        }
    }
}
