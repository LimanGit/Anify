import type { IChapter } from "../..";
import type { ISource } from "../mappings/impl/anime";
import type { IPage } from "../mappings/impl/manga";

/**
 * A common interface that all Extractors must adhere to.
 */
export interface IVideoExtractor {
    /**
     * Extracts the streaming source(s) for a given URL.
     *
     * @param url   The streaming server URL.
     * @returns     A `Source` or `undefined` if extraction fails.
     */
    extract(url: string): Promise<ISource | undefined>;
}

/**
 * A common interface that all Extractors must adhere to.
 */
export interface INovelExtractor {
    /**
     * The URL of the novel extractor.
     */
    url: string;

    /**
     * Whether the novel extractor needs a proxy.
     */
    needsProxy: boolean;

    /**
     * Extracts the pages for a given chapter.
     *
     * @param url       The novel URL.
     * @param chapterId The chapter ID.
     * @returns         A `Page` or `string` or `undefined` if extraction fails.
     */
    extract(url: string, chapter: IChapter | null): Promise<IPage[] | string | undefined>;
}
