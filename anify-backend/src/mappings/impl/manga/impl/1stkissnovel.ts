import { load } from "cheerio";
import MangaProvider from "..";
import { type IChapter, type IProviderResult, MediaFormat } from "../../../../types";
import type { IPage } from "../../../../types/impl/mappings/impl/manga";

export default class FirstKissNovel extends MangaProvider {
    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override id = "1stkissnovel";
    override url = "https://1stkissnovel.org";

    public needsProxy: boolean = false;
    public useGoogleTranslate: boolean = false;

    override formats: MediaFormat[] = [MediaFormat.NOVEL];

    override async search(query: string): Promise<IProviderResult[] | undefined> {
        const results: IProviderResult[] = [];

        const data = (await (
            await this.request(`${this.url}/wp-admin/admin-ajax.php`, {
                method: "POST",
                headers: {
                    Referer: this.url,
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 OPR/107.0.0.0",
                    "X-Requested-With": "XMLHttpRequest",
                    "X-Content-Type-Options": "nosniff",
                    "X-Frame-Options": "SAMEORIGIN",
                    "X-Robots-Tag": "noindex",
                },
                body: `action=wp-manga-search-manga&title=${encodeURIComponent(query)}`,
            })
        ).json()) as {
            success: boolean;
            data: { title: string; url: string; type: string }[];
        };

        if (!data.success) return undefined;

        for (const item of data.data) {
            results.push({
                id: item.url.split("/novel/")[1] ?? "",
                title: item.title,
                img: "",
                altTitles: [],
                format: MediaFormat.NOVEL,
                providerId: this.id,
                year: 0,
            });
        }

        return results;
    }

    override async fetchChapters(id: string): Promise<IChapter[] | undefined> {
        const chapters: IChapter[] = [];

        const data = await (
            await this.request(`${this.url}/novel/${id.endsWith("/") ? id : id + "/"}ajax/chapters`, {
                method: "POST",
                headers: {
                    Referer: `${this.url}/novel/${id}`,
                    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                    "X-Requested-With": "XMLHttpRequest",
                },
            })
        ).text();

        const $ = load(data);

        for (let i = 0; i < $("ul .wp-manga-chapter").length; i++) {
            const el = $("ul .wp-manga-chapter").toArray().reverse()[i];
            const title = $(el).find("a").text().trim();
            const id = $(el).find("a").attr("href") ?? "";

            chapters.push({
                id: id.split(this.url)[1] ?? "",
                title,
                number: i + 1,
                rating: null,
                updatedAt: new Date($(el).find(".chapter-release-date").text().trim()).getTime(),
            });
        }

        return chapters;
    }

    override async fetchPages(id: string): Promise<IPage[] | string | undefined> {
        const data = await (await this.request(`${this.url}${id}`)).text();

        const $ = load(data);
        return $("div.text-left").toString();
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: IProviderResult[] = [];

            const data = (await (
                await this.request(`${this.url}/wp-admin/admin-ajax.php`, {
                    proxy: proxyURL,
                    method: "POST",
                    headers: {
                        Referer: this.url,
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 OPR/107.0.0.0",
                        "X-Requested-With": "XMLHttpRequest",
                        "X-Content-Type-Options": "nosniff",
                        "X-Frame-Options": "SAMEORIGIN",
                        "X-Robots-Tag": "noindex",
                    },
                    body: `action=wp-manga-search-manga&title=${encodeURIComponent("Mushoku Tensei")}`,
                })
            ).json()) as {
                success: boolean;
                data: { title: string; url: string; type: string }[];
            };

            if (!data.success) return false;

            for (const item of data.data) {
                results.push({
                    id: item.url.split("/novel/")[1] ?? "",
                    title: item.title,
                    img: "",
                    altTitles: [],
                    format: MediaFormat.NOVEL,
                    providerId: this.id,
                    year: 0,
                });
            }

            return results.length > 0;
        } catch {
            return false;
        }
    }
}
