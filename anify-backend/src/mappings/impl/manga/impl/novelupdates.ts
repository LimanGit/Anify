import { load } from "cheerio";
import MangaProvider from "..";
import { type IChapter, type IProviderResult, MediaFormat } from "../../../../types";
import { NovelProviders, type IPage } from "../../../../types/impl/mappings/impl/manga";
import { env } from "../../../../env";
import { NOVEL_EXTRACTOR_MAP, extractNovel } from "../../../../novel-extractors";

export default class NovelUpdates extends MangaProvider {
    override rateLimit: number = 100; // Needs a high rate limit cause bruh
    override maxConcurrentRequests: number = 7;
    override id = "novelupdates";
    override url = "https://www.novelupdates.com";

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    override formats: MediaFormat[] = [MediaFormat.NOVEL];

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

    override async search(query: string, format?: MediaFormat, year?: number, retries = 0): Promise<IProviderResult[] | undefined> {
        const results: IProviderResult[] = [];

        const searchData = await this.request(`${this.url}/series-finder/?sf=1&sh=${encodeURIComponent(query)}&nt=2443,26874,2444&ge=${this.genreMappings.ADULT}&sort=sread&order=desc`, {
            method: "GET",
            headers: {
                Referer: this.url,
                "User-Agent": "Mozilla/5.0",
            },
        });

        const data = await searchData.text();

        const $ = load(data);

        const title = $("title").html();
        if (title === "Just a moment..." || title === "Attention Required! | Cloudflare") {
            return this.search(query, format, year, retries + 1);
        }

        $("div.search_main_box_nu").each((_, el) => {
            const img = $(el).find("div.search_img_nu img").attr("src");
            const title = $(el).find("div.search_body_nu div.search_title a").text();
            const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

            results.push({
                id: id!,
                title: title!,
                img: img!,
                altTitles: [],
                format: MediaFormat.NOVEL,
                providerId: this.id,
                year: 0,
            });
        });

        return results;
    }

    override async fetchChapters(id: string, retries = 0): Promise<IChapter[] | undefined> {
        if (retries >= 5) return undefined;

        const chapters: IChapter[] = [];

        // Might need to test if there are links or not. If the cookie is expired, then there won't be any links.
        // NovelUpdates recently changed things and server-renders all their chapter links.
        let hasNextPage = true;

        for (let i = 1; hasNextPage; i++) {
            this.useGoogleTranslate = false;
            const data = await (
                await this.request(
                    `${this.url}/series/${id}/?pg=${i}#myTable`,
                    {
                        headers: {
                            Cookie: env.NOVELUPDATES_LOGIN ?? "",
                            "User-Agent": "Mozilla/5.0",
                        },
                    },
                    false,
                )
            ).text(); // might need to change to true
            this.useGoogleTranslate = true;

            const $ = load(data);

            if ($("div.l-submain table#myTable tr").length < 1 || !$("div.l-submain table#myTable tr")) {
                hasNextPage = false;
                break;
            } else {
                for (let l = 0; l < $("div.l-submain table#myTable tr").length; l++) {
                    const title = $("div.l-submain table#myTable tr").eq(l).find("td a.chp-release").attr("title");
                    const id = $("div.l-submain table#myTable tr").eq(l).find("td a.chp-release").attr("href")?.split("/extnu/")[1].split("/")[0];

                    if (!title || !id) continue;

                    if ((chapters.length > 0 && chapters[chapters.length - 1].id === id) || chapters.find((c) => c.id === id)) {
                        hasNextPage = false;
                        break;
                    }

                    chapters.push({
                        id: id!,
                        title: title!,
                        number: l,
                        rating: null,
                        updatedAt: new Date($("div.l-submain table#myTable tr").eq(l).find("td").first().text().trim()).getTime(),
                    });
                }
            }
        }

        if (chapters.length === 0) {
            console.log("WARNING: Cookie seems to not work. Trying without cookie.");
            // More scuffed version that doesn't seem to work anymore. I think NovelUpdates changed things
            // and now their admin-ajax will return randomized chapters to prevent scrapers. GG

            const $ = load(
                await (
                    await this.request(`${this.url}/series/${id}/`, {
                        headers: {
                            Referer: this.url,
                            "User-Agent": "Mozilla/5.0",
                        },
                    })
                ).text(),
            );

            const postId = $("input#mypostid").attr("value");

            this.useGoogleTranslate = false;
            const chapterData = (
                await (
                    await this.request(`${this.url}/wp-admin/admin-ajax.php`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                            Cookie: env.NOVELUPDATES_LOGIN ?? "",
                            "User-Agent": "Mozilla/5.0",
                        },
                        body: `action=nd_getchapters&mypostid=${postId}&mygrr=0`,
                    })
                ).text()
            ).substring(1);

            this.useGoogleTranslate = true;

            const $$ = load(chapterData);

            if (chapterData.includes("not whitelisted by the operator of this proxy") || $$("title").html() === "Just a moment...") return this.fetchChapters(id, retries + 1);

            const uniqueTitles = new Set<string>();
            $$("li.sp_li_chp a[data-id]").each((index, el) => {
                const id = $$(el).attr("data-id");
                const title = $$(el).find("span").text();

                if (!uniqueTitles.has(title)) {
                    uniqueTitles.add(title);

                    chapters.push({
                        id: id!,
                        title: title!,
                        number: index + 1,
                        rating: null,
                    });
                }
            });

            return chapters.reverse();
        }

        return chapters.reverse();
    }

    private async fetchChaptersWithoutCookie(id: string): Promise<IChapter[] | undefined> {
        console.log("WARNING: Cookie seems to not work. Trying without cookie.");
        // More scuffed version that doesn't seem to work anymore. I think NovelUpdates changed things
        // and now their admin-ajax will return randomized chapters to prevent scrapers. GG

        const $ = load(
            await (
                await this.request(`${this.url}/series/${id}/`, {
                    headers: {
                        Referer: this.url,
                        "User-Agent": "Mozilla/5.0",
                    },
                })
            ).text(),
        );

        const postId = $("input#mypostid").attr("value");

        const chapterData = (
            await (
                await this.request(`${this.url}/wp-admin/admin-ajax.php`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        Cookie: env.NOVELUPDATES_LOGIN ?? "",
                        "User-Agent": "Mozilla/5.0",
                    },
                    body: `action=nd_getchapters&mypostid=${postId}&mygrr=0`,
                })
            ).text()
        ).substring(1);

        const $$ = load(chapterData);

        if (chapterData.includes("not whitelisted by the operator of this proxy") || $$("title").html() === "Just a moment...") return undefined;

        const chapters: IChapter[] = [];
        const uniqueTitles = new Set<string>();
        $$("li.sp_li_chp a[data-id]").each((index, el) => {
            const id = $$(el).attr("data-id");
            const title = $$(el).find("span").text();

            if (!uniqueTitles.has(title)) {
                uniqueTitles.add(title);

                chapters.push({
                    id: id!,
                    title: title!,
                    number: index + 1,
                    rating: null,
                });
            }
        });

        return chapters.reverse();
    }

    override async fetchPages(id: string, proxy: boolean = true, chapter: IChapter | null = null): Promise<IPage[] | string | undefined> {
        const req = await this.request(
            `${this.url}/extnu/${id}/`,
            {
                method: "GET",
                headers: {
                    Cookie: "_ga=;",
                    "User-Agent": "Mozilla/5.0",
                },
                redirect: "follow",
            },
            proxy,
        );

        if (req.status === 500 || req.statusText === "Timeout" || (req.status === 400 && req.statusText === "Bad Request")) return await this.fetchPages(id, false, chapter);

        const data = await req.text();
        const $ = load(data);
        const baseURL = $("base").attr("href")?.replace("http://", "https://") ?? this.url;

        switch (true) {
            case baseURL.includes("zetrotranslation.com"):
                return await extractNovel(baseURL, NovelProviders.ZetroTranslations, chapter);
            default:
                return undefined;
        }
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: IProviderResult[] = [];

            const searchData = await this.request(`${this.url}/series-finder/?sf=1&sh=${encodeURIComponent("Mushoku Tensei")}&nt=2443,26874,2444&ge=${this.genreMappings.ADULT}&sort=sread&order=desc`, {
                proxy: proxyURL,
                method: "GET",
                headers: {
                    Referer: this.url,
                    "User-Agent": "Mozilla/5.0",
                },
            });

            const data = await searchData.text();

            const $ = load(data);

            const title = $("title").html();
            if (title === "Just a moment..." || title === "Attention Required! | Cloudflare") {
                return false;
            }

            $("div.search_main_box_nu").each((_, el) => {
                const img = $(el).find("div.search_img_nu img").attr("src");
                const title = $(el).find("div.search_body_nu div.search_title a").text();
                const id = $(el).find("div.search_body_nu div.search_title a").attr("href")?.split("/series/")[1].split("/")[0];

                results.push({
                    id: id!,
                    title: title!,
                    img: img!,
                    altTitles: [],
                    format: MediaFormat.NOVEL,
                    providerId: this.id,
                    year: 0,
                });
            });

            if (results.length > 0) {
                // Now test all the novel extractors
                for (const novelExtractor of Object.values(NOVEL_EXTRACTOR_MAP)) {
                    if (novelExtractor.needsProxy) {
                        const test = await fetch(novelExtractor.url);
                        if (!test.ok) return false;
                    }
                }

                return true;
            } else {
                return false;
            }
        } catch {
            return false;
        }
    }
}
