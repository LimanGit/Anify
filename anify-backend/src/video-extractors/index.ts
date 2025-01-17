import type { IVideoExtractor } from "../types/impl/extractors";
import { type ISource, StreamingServers } from "../types/impl/mappings/impl/anime";
import { GogoCDN } from "./impl/gogocdn";
import { VidStreaming } from "./impl/vidstreaming";
import { Kwik } from "./impl/kwik";
import { StreamSB } from "./impl/streamsb";
import { VidCloud } from "./impl/vidcloud";

const VIDEO_EXTRACTOR_MAP: Record<StreamingServers, IVideoExtractor> = {
    [StreamingServers.GogoCDN]: new GogoCDN(),
    [StreamingServers.VidStreaming]: new VidStreaming(),
    [StreamingServers.Kwik]: new Kwik(),
    [StreamingServers.StreamSB]: new StreamSB(),
    [StreamingServers.VidCloud]: new VidCloud(),
};

/**
 * Extracts source links from the specified streaming server URL.
 *
 * @param url     The streaming server URL
 * @param server  The enum representing which server to use
 */
export async function extractSource(url: string, server: StreamingServers): Promise<ISource | undefined> {
    const extractor = VIDEO_EXTRACTOR_MAP[server];
    if (!extractor) {
        console.warn(`[ExtractorService] No extractor found for server: ${server}`);
        return undefined;
    }

    try {
        return await extractor.extract(url);
    } catch (error) {
        console.error(`[ExtractorService] Extraction error for ${server}:`, error);
        return undefined;
    }
}
