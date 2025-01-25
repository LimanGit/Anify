import { load } from "cheerio";
import BaseNovelExtractor from "../../types/impl/extractors/impl/baseNovelExtractor";
import { type IPage, NovelProviders } from "../../types/impl/mappings/impl/manga";
import type { IChapter } from "../../types";

export class ZetroTranslations extends BaseNovelExtractor {
    override url = "https://zetrotranslation.com";
    override needsProxy = false;

    protected server: NovelProviders = NovelProviders.ZetroTranslations;

    public async extract(url: string, chapter: IChapter | null = null): Promise<IPage[] | string | undefined> {
        const $ = load(await (await this.request(url)).text());
        if (($("div.entry-content_wrap div.reading-content")?.html() ?? []).length === 0 && chapter && chapter?.title.length > 0) {
            const mangaId = $("div#manga-chapters-holder").attr("data-id");
            const data = await (
                await this.request(
                    "https://zetrotranslation.com/wp-admin/admin-ajax.php",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/x-www-form-urlencoded",
                            "X-Requested-With": "XMLHttpRequest",
                            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.118 Safari/537.36",
                            Referer: url,
                        },
                        body: `action=manga_get_chapters&manga=${mangaId}`,
                    },
                    false,
                )
            ).text();

            const $$ = load(data);

            const novelVolume = (chapter?.title.startsWith("v") ? chapter?.title.split("v")[1]?.split(" ")[0] : "").split("c")[0];
            const novelChapter = (chapter?.title.startsWith("v") ? chapter?.title.split("v")[1]?.split(" ")[0]?.split("c")[1] : chapter?.title.startsWith("c") ? chapter?.title.split("c")[1].split(" ")[0] : "") ?? "";
            const novelPrologue = chapter?.title.split(" ").length > 1 ? chapter?.title.split(" ")[1]?.includes("prologue") : chapter?.title.includes("prologue");
            const novelIllustrations = chapter?.title.split(" ").length > 1 ? chapter?.title.split(" ")[1]?.includes("illustrations") : chapter?.title.includes("illustrations");

            const zetroData: {
                volume: string;
                chapter: string;
                part: string;
                prologue: boolean;
                illustrations: boolean;
                data?: string;
            }[] = [];

            for (let i = 0; i < ($$("ul.sub-chap-list li.wp-manga-chapter").toArray().length > 0 ? $$("ul.sub-chap-list li.wp-manga-chapter").toArray().length : $$("li.wp-manga-chapter").length); i++) {
                const el = ($$("ul.sub-chap-list li.wp-manga-chapter").toArray().length > 0 ? $$("ul.sub-chap-list li.wp-manga-chapter").toArray() : $$("li.wp-manga-chapter"))[i];

                const title = $$(el).find("a").text().trim();
                const volume = ($$(el).parent().parent().parent().parent().find("a.has-child").text() ?? null)?.split(" ")[0] ?? "";

                const isPrologue = title.toLowerCase().includes("prologue");
                const isIllustrations = title.toLowerCase().includes("illustrations");

                const chapter = title.toLowerCase().split("chapter ")[1]?.split(" ")[0] ?? title.toLowerCase().split("ch-")[1]?.split(" ")[0] ?? title.toLowerCase().split("chp ")[1]?.split(" ")[0] ?? title.toLowerCase().split("episode ")[1]?.split(" ")[0] ?? "";

                if ((volume?.length > 0 && novelVolume?.length > 0 ? novelVolume === volume : true) && isPrologue && novelPrologue) {
                    const newURL = $$(el).find("a").attr("href");
                    const $$$ = load(await (await this.request(newURL ?? "", {}, false)).text());

                    const currentData = zetroData.find((d) => d.volume === volume && d.prologue);
                    if (currentData) {
                        currentData.data = $$$("div.entry-content_wrap div.reading-content").html() ?? "";
                    } else {
                        zetroData.push({
                            volume,
                            chapter,
                            part: "",
                            prologue: isPrologue,
                            illustrations: isIllustrations,
                            data: $$$("div.entry-content_wrap").html() ?? "",
                        });
                    }
                }

                if ((volume?.length > 0 && novelVolume?.length > 0 ? novelVolume === volume : true) && isIllustrations && novelIllustrations) {
                    const newURL = $$(el).find("a").attr("href");
                    const $$$ = load(await (await this.request(newURL ?? "", {}, false)).text());

                    const currentData = zetroData.find((d) => d.volume === volume && d.illustrations);
                    if (currentData) {
                        currentData.data = $$$("div.entry-content_wrap div.reading-content").html() ?? "";
                    } else {
                        zetroData.push({
                            volume,
                            chapter,
                            part: "",
                            prologue: isPrologue,
                            illustrations: isIllustrations,
                            data: $$$("div.entry-content_wrap").html() ?? "",
                        });
                    }
                }

                if ((volume?.length > 0 && novelVolume?.length > 0 ? novelVolume === volume : true) && novelChapter === chapter && !isPrologue && !isIllustrations) {
                    const newURL = $$(el).find("a").attr("href");
                    const $$$ = load(await (await this.request(newURL ?? "", {}, false)).text());

                    const currentData = zetroData.find((d) => d.volume === volume && d.chapter === chapter);
                    if (currentData) {
                        currentData.data = $$$("div.entry-content_wrap div.reading-content").html() ?? "";
                    } else {
                        zetroData.push({
                            volume,
                            chapter,
                            part: "",
                            prologue: isPrologue,
                            illustrations: isIllustrations,
                            data: $$$("div.entry-content_wrap div.reading-content").html() ?? "",
                        });
                    }
                }
            }

            const item = zetroData.find((d) => (novelVolume.length > 0 ? d.volume === novelVolume : true && novelChapter.length > 0 ? d.chapter === novelChapter : true && d.illustrations === novelIllustrations && d.prologue === novelPrologue));
            return item?.data ?? "";
        } else {
            return $("div.entry-content_wrap").html() ?? "";
        }
    }
}
