import { load } from "cheerio";
import MetaProvider from "..";
import { type IProviderResult, MediaFormat } from "../../../../types";

export default class AniDBMeta extends MetaProvider {
    override id = "anidb";
    override url = "https://anidb.net";

    public needsProxy: boolean = true;
    public useGoogleTranslate: boolean = false;

    override rateLimit = 0;
    override maxConcurrentRequests: number = -1;
    override formats: MediaFormat[] = [MediaFormat.TV, MediaFormat.MOVIE, MediaFormat.ONA, MediaFormat.SPECIAL, MediaFormat.TV_SHORT, MediaFormat.OVA];

    private formatMapping = {
        MOVIE: "type.movie=1",
        MUSIC: "type.musicvideo=1",
        OVA: "type.ova=1",
        TV: "type.tvseries=1",
        SPECIAL: "type.tvspecial=1",
    };

    override async search(query: string, format?: MediaFormat): Promise<IProviderResult[] | undefined> {
        const results: IProviderResult[] = [];

        const data = await (
            await this.request(`${this.url}/search/fulltext/?adb.search=${encodeURIComponent(query)}&do.search=1&entity.animetb=1&field.titles=1${format && format !== MediaFormat.UNKNOWN ? `&${this.formatMapping[format?.toUpperCase() as keyof typeof this.formatMapping]}` : ""}`)
        ).text();

        const $ = load(data);

        const promises: Promise<void>[] = [];

        $("table.search_results tbody tr").map((i, el) => {
            promises.push(
                new Promise(async (resolve) => {
                    const id = ($(el).find("td.relid a").attr("href") ?? "").split("/anime/")[1]?.split("?")[0];
                    const req = await (await this.request(`${this.url}/anime/${id}`)).text();
                    const $$ = load(req);

                    const english = $$("div.info div.titles tr.official").first()?.find("td.value label").text();
                    const romaji = $$("div.info div.titles tr.romaji td.value span").text();
                    const native = $$("div.info div.titles tr.official").last()?.find("td.value label").text();
                    const synonyms =
                        $$("div.info div.titles tr.syn td.value")
                            .text()
                            ?.split(", ")
                            .map((data) => data.trim())
                            .concat($$("div.titles tr.short td.value").text()?.split(", ")) ?? [];
                    const year = Number.isNaN(new Date($$("div.info tr.year td.value span").first()?.attr("content")?.trim() ?? "").getFullYear()) ? 0 : new Date($$("div.info tr.year td.value span").first()?.attr("content")?.trim() ?? "").getFullYear();

                    const altTitles = [english, romaji, native, ...synonyms].filter(Boolean);

                    results.push({
                        id: `/anime/${id}`,
                        altTitles,
                        title: $(el).find("td.relid a").text()?.trim(),
                        format: format ? format : MediaFormat.UNKNOWN,
                        img: $(el).find("td.thumb img").attr("src") ?? "",
                        providerId: this.id,
                        year,
                    });

                    resolve();
                }),
            );
        });

        await Promise.all(promises);

        return results;
    }

    override async proxyCheck(proxyURL: string): Promise<boolean | undefined> {
        try {
            const results: IProviderResult[] = [];

            const data = await (
                await this.request(`${this.url}/search/fulltext/?adb.search=${encodeURIComponent("Mushoku Tensei")}&do.search=1&entity.animetb=1&field.titles=1`, {
                    proxy: proxyURL,
                })
            ).text();

            const $ = load(data);

            const promises: Promise<void>[] = [];

            $("table.search_results tbody tr").map((i, el) => {
                promises.push(
                    new Promise(async (resolve) => {
                        const id = ($(el).find("td.relid a").attr("href") ?? "").split("/anime/")[1]?.split("?")[0];
                        const req = await (await this.request(`${this.url}/anime/${id}`)).text();
                        const $$ = load(req);

                        const english = $$("div.info div.titles tr.official").first()?.find("td.value label").text();
                        const romaji = $$("div.info div.titles tr.romaji td.value span").text();
                        const native = $$("div.info div.titles tr.official").last()?.find("td.value label").text();
                        const synonyms =
                            $$("div.info div.titles tr.syn td.value")
                                .text()
                                ?.split(", ")
                                .map((data) => data.trim())
                                .concat($$("div.titles tr.short td.value").text()?.split(", ")) ?? [];
                        const year = Number.isNaN(new Date($$("div.info tr.year td.value span").first()?.attr("content")?.trim() ?? "").getFullYear()) ? 0 : new Date($$("div.info tr.year td.value span").first()?.attr("content")?.trim() ?? "").getFullYear();

                        const altTitles = [english, romaji, native, ...synonyms].filter(Boolean);

                        results.push({
                            id: `/anime/${id}`,
                            altTitles,
                            title: $(el).find("td.relid a").text()?.trim(),
                            format: MediaFormat.UNKNOWN,
                            img: $(el).find("td.thumb img").attr("src") ?? "",
                            providerId: this.id,
                            year,
                        });

                        resolve();
                    }),
                );
            });

            await Promise.all(promises);

            return results.length > 0;
        } catch {
            return false;
        }
    }
}
