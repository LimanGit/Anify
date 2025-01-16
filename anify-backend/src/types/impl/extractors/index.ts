import type { ISource } from "../mappings/impl/anime";

/**
 * A common interface that all Extractors must adhere to.
 */
export interface IExtractor {
    /**
     * Extracts the streaming source(s) for a given URL.
     *
     * @param url   The streaming server URL.
     * @returns     A `Source` or `undefined` if extraction fails.
     */
    extract(url: string): Promise<ISource | undefined>;
}
