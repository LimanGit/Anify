import { load } from "cheerio";
import MangaProvider from "..";
import { type IChapter, type IProviderResult, MediaFormat } from "../../../../types";
import type { IPage } from "../../../../types/impl/mappings/impl/manga";
import { compareTwoStrings } from "../../../../helper/impl/string";

export default class JNovels extends MangaProvider {
    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override id = "jnovels";
    override url = "https://jnovels.com";

    public needsProxy: boolean = false;
    public useGoogleTranslate: boolean = false;

    override formats: MediaFormat[] = [MediaFormat.NOVEL];

    override async search(query: string): Promise<IProviderResult[] | undefined> {
        const lightNovels = await (await this.request(`${this.url}/light-novel-pdf-jp/`)).text();
        const novelResults = await this.handleSearchResults(query, lightNovels);

        if (novelResults?.length > 0) return novelResults;

        const webNovels = await (await this.request(`${this.url}/webnovel-list-jp/`)).text();
        const webResults = await this.handleSearchResults(query, webNovels);

        return webResults;
    }

    private async handleSearchResults(query: string, data: string, proxyURL?: string) {
        const $ = load(data);

        const elements = $("div.post-content ol li").toArray();

        const resultsPromises: Promise<IProviderResult>[] = elements.map(async (el) => {
            const item = $(el);
            const id = item.find("a").attr("href")?.split("/")[3] ?? "";
            const title = item.find("a").text()?.trim() ?? "";

            // If contains style attribute skip
            if (item.find("a").attr("style")) return {} as IProviderResult;

            if (compareTwoStrings(title, query) < 0.5) return {} as IProviderResult;

            const pageData = await (
                await this.request(
                    `${this.url}/${id}`,
                    {
                        proxy: proxyURL,
                    },
                    true,
                )
            ).text();
            const $$ = load(pageData);

            let associated = [];
            if ($$("div#editassociated").length === 0) {
                const associatedNamesLabel = $$('p:contains("Associated Names")').text()?.split("Related Series")[0];
                associated = associatedNamesLabel
                    .split("\n")
                    .slice(1)
                    .map((x) => x.trim());
            } else {
                associated = $$("div#editassociated").text().split("\n");
            }

            return {
                id: id,
                altTitles: associated?.length > 0 ? associated.map((x) => x.trim()).filter((x) => x.length != 0) : [],
                format: MediaFormat.NOVEL,
                img: $$("div.featured-media img").attr("src") ?? "",
                providerId: this.id,
                title: title,
                year: 0,
            };
        });

        const results = (await Promise.all(resultsPromises)).filter((x) => x.title);
        return results;
    }

    override async fetchChapters(id: string): Promise<IChapter[] | undefined> {
        const chapters: IChapter[] = [];

        const data = await (await this.request(`${this.url}/${id}`)).text();

        const $ = load(data);

        $("main div.post-content ol li").map((i, el) => {
            const id = $(el).find("a").attr("href")!;
            if (id && !id.includes(this.url)) {
                const title = $(el).text()?.split(" ——")[0];
                chapters.push({
                    id: id,
                    title: title?.trim(),
                    number: i + 1,
                    rating: null,
                });
            }
        });

        return chapters;
    }

    override async fetchPages(id: string): Promise<IPage[] | string | undefined> {
        return `No content able to read! You may download the novel <a href="${id}" target="_blank">here</a>.`;
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const query = "Mushoku Tensei";

            const lightNovels = await (
                await this.request(`${this.url}/light-novel-pdf-jp/`, {
                    proxy: proxyURL,
                })
            ).text();
            const novelResults = await this.handleSearchResults(query, lightNovels, proxyURL);

            if (novelResults?.length > 0) return novelResults.length > 0;

            const webNovels = await (
                await this.request(`${this.url}/webnovel-list-jp/`, {
                    proxy: proxyURL,
                })
            ).text();
            const webResults = await this.handleSearchResults(query, webNovels, proxyURL);

            return webResults?.length > 0;
        } catch {
            return false;
        }
    }
}
