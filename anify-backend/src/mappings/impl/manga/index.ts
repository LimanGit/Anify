import { type IChapter, type IProviderResult, MediaFormat, ProviderType } from "../../../types";
import type { IManga } from "../../../types/impl/database/impl/schema/manga";
import type { IPage } from "../../../types/impl/mappings/impl/manga";
import { MediaProvider } from "../../../types/impl/mappings/impl/mediaProvider";

export default abstract class MangaProvider extends MediaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: MediaFormat[];

    public providerType: ProviderType = ProviderType.MANGA;
    public preferredTitle: "english" | "romaji" | "native" = "english";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async search(query: string, format?: MediaFormat, year?: number): Promise<IProviderResult[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchChapters(id: string): Promise<IChapter[] | undefined> {
        return undefined;
    }

    async fetchRecent(): Promise<IManga[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchPages(id: string, proxy: boolean = false, chapter: IChapter | null = null): Promise<IPage[] | string | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async proxyCheck(_proxyUrl: string): Promise<boolean | undefined> {
        return undefined;
    }

    padNum(number: string, places: number): string {
        // Credit to https://stackoverflow.com/a/10073788
        /*
         * '17'
         * '17.5'
         * '17-17.5'
         * '17 - 17.5'
         * '17-123456789'
         */
        let range = number.split("-");
        range = range.map((chapter) => {
            chapter = chapter.trim();
            const digits = chapter.split(".")[0].length;
            return "0".repeat(Math.max(0, places - digits)) + chapter;
        });
        return range.join("-");
    }
}
