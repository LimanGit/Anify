import type { IChapter } from "../types";
import { type INovelExtractor } from "../types/impl/extractors";
import { type IPage, NovelProviders } from "../types/impl/mappings/impl/manga";
import { ZetroTranslations } from "./impl/zetrotranslations";

export const NOVEL_EXTRACTOR_MAP: Record<NovelProviders, INovelExtractor> = {
    [NovelProviders.ZetroTranslations]: new ZetroTranslations(),
};

/**
 * Extracts source links from the specified streaming server URL.
 *
 * @param url     The streaming server URL
 * @param server  The enum representing which server to use
 */
export async function extractNovel(url: string, server: NovelProviders, chapter: IChapter | null = null): Promise<IPage[] | string | undefined> {
    const extractor = NOVEL_EXTRACTOR_MAP[server];
    if (!extractor) {
        console.warn(`[ExtractorService] No extractor found for server: ${server}`);
        return undefined;
    }

    try {
        return await extractor.extract(url, chapter);
    } catch (error) {
        console.error(`[ExtractorService] Extraction error for ${server}:`, error);
        return undefined;
    }
}
