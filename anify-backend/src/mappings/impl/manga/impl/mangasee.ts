import { load } from "cheerio";
import MangaProvider from "..";
import { type IChapter, type IProviderResult, MediaFormat } from "../../../../types";
import type { IPage } from "../../../../types/impl/mappings/impl/manga";
import { stringSearch } from "../../../../helper/impl/string";

export default class MangaSee extends MangaProvider {
    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override id = "mangasee";
    override url = "https://mangasee123.com";

    public needsProxy: boolean = false;
    public useGoogleTranslate: boolean = false;

    override formats: MediaFormat[] = [MediaFormat.MANGA, MediaFormat.ONE_SHOT];

    override async search(query: string): Promise<IProviderResult[] | undefined> {
        const list = await this.getMangaList();
        const results: IProviderResult[] = [];

        for (let i = 0; i < list.length; i++) {
            if (
                stringSearch(list[i].s, query) >= 0.6 ||
                list[i].a
                    .map((title) => {
                        return stringSearch(title, query) >= 0.6;
                    })
                    .includes(true)
            ) {
                results.push({
                    title: list[i].s,
                    id: `/manga/${list[i].i}`,
                    altTitles: list[i].a,
                    year: 0,
                    img: null,
                    format: MediaFormat.UNKNOWN,
                    providerId: this.id,
                });
            }
        }

        return results;
    }

    private async getMangaList(): Promise<ISearchResult[]> {
        const req = await this.request(`${this.url}/_search.php`, {
            method: "POST",
            headers: {
                Referer: this.url,
            },
        });
        const data: [ISearchResult] = (await req.json()) as [ISearchResult];
        return data;
    }

    override async fetchChapters(id: string): Promise<IChapter[] | undefined> {
        const data = await this.request(`${this.url}${id}`);
        const chapters: IChapter[] = [];

        const $ = load(await data.text());

        const mangaId = id.split("/manga/")[1];
        const scriptContent = $("body > script:nth-child(16)").get()[0];

        const scriptText = $(scriptContent).html() || "";

        const chaptersData = this.processScriptTagVariable<IChapterData[]>(scriptText, "vm.Chapters = ");
        chaptersData?.map((chapter) => {
            chapters.push({
                id: `/read-online/${mangaId}-chapter-${this.processChapterNumber(chapter.Chapter)}`,
                title: `${chapter.ChapterName && chapter.ChapterName.length > 0 ? chapter.ChapterName : `Chapter ${this.processChapterNumber(chapter.Chapter)}`}`,
                number: parseInt(this.processChapterNumber(chapter.Chapter)),
                updatedAt: new Date(chapter.Date).getTime(),
                rating: null,
            });
        });

        return chapters;
    }

    private processScriptTagVariable = <T>(script: string | null, variable: string): T | null => {
        if (!script) return null;

        const variableIndex = script.search(variable);
        if (variableIndex === -1) return null;

        const chopFront = script.substring(variableIndex + variable.length, script.length);
        const endIndex = chopFront.search(";");
        if (endIndex === -1) return null;

        try {
            const jsonStr = chopFront.substring(0, endIndex);
            return JSON.parse(jsonStr) as T;
        } catch {
            return null;
        }
    };

    private processChapterNumber = (chapter: string): string => {
        const decimal = chapter.substring(chapter.length - 1, chapter.length);
        chapter = chapter.replace(chapter[0], "").slice(0, -1);
        if (decimal == "0") return `${+chapter}`;

        if (chapter.startsWith("0")) chapter = chapter.replace(chapter[0], "");

        return `${+chapter}.${decimal}`;
    };

    override async fetchPages(id: string): Promise<IPage[] | string | undefined> {
        const data = await this.request(`${this.url}${id}-page-1.html`);

        const images: IPage[] = [];

        const $ = load(await data.text());

        const scriptContent = $("body > script:nth-child(19)").get()[0];
        const scriptText = $(scriptContent).html() || "";

        const curChapter = this.processScriptTagVariable<IChapterData>(scriptText, "vm.CurChapter = ");
        const imageHost = this.processScriptTagVariable<string>(scriptText, "vm.CurPathName = ");
        const curChapterLength = curChapter ? Number(curChapter.Page) : 0;

        for (let i = 0; i < curChapterLength; i++) {
            const chapter = this.processChapterForImageUrl(id.replace(/[^0-9.]/g, ""));
            const page = `${i + 1}`.padStart(3, "0");
            const mangaId = id.split("-chapter-", 1)[0].split("/read-online/")[1];
            const imagePath = `https://${imageHost}/manga/${mangaId}/${chapter}-${page}.png`;

            images.push({
                url: imagePath,
                index: i,
                headers: {
                    Referer: this.url,
                },
            });
        }

        return images;
    }

    private processChapterForImageUrl = (chapter: string): string => {
        if (!chapter.includes(".")) return chapter.padStart(4, "0");

        const values = chapter.split(".");
        const pad = values[0].padStart(4, "0");

        return `${pad}.${values[1]}`;
    };

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: IProviderResult[] = [];

            const data = await (
                await this.request(`${this.url}/search?q=${encodeURIComponent("Mushoku Tensei")}`, {
                    proxy: proxyURL,
                })
            ).text();
            const $ = load(data);

            $("div.container div.my-3.justify-end > div").map((i, el) => {
                results.push({
                    id: $(el).find("a").attr("href")?.split("/manga/")[1] ?? "",
                    title: $(el).find("div > a > div.mt-3").text().trim(),
                    altTitles: $(el).find("div > a > div.text-xs.text-secondary").text().trim() ? [$(el).find("div > a > div.text-xs.text-secondary").text().trim()] : [],
                    img: $(el).find("a img").attr("data-src") ?? "",
                    year: Number.isNaN(Number($($(el).find("div > div.flex > div").find("div")[1]).text().trim())) ? 0 : Number($($(el).find("div > div.flex > div").find("div")[1]).text().trim()),
                    format: MediaFormat.UNKNOWN,
                    providerId: this.id,
                });
            });

            return results.length > 0;
        } catch {
            return false;
        }
    }
}

interface ISearchResult {
    i: string; // image
    s: string; // Main title
    a: [string]; // Alternative titles
}

interface IChapterData {
    Chapter: string;
    ChapterName: string;
    Date: string;
    Page: string;
}
