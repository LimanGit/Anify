import BaseVideoExtractor from "../../types/impl/extractors/impl/baseVideoExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";
import { extractSource } from "..";

/**
 * @description Same as Gogo.
 */
export class VidStreaming extends BaseVideoExtractor {
    protected server: StreamingServers = StreamingServers.VidStreaming;

    public async extract(url: string): Promise<ISource> {
        const result: ISource = {
            sources: [],
            audio: [],
            headers: {},
            intro: {
                start: 0,
                end: 0,
            },
            outro: {
                start: 0,
                end: 0,
            },
            subtitles: [],
        };

        const data = await extractSource(url, StreamingServers.GogoCDN);
        return data ?? result;
    }
}
