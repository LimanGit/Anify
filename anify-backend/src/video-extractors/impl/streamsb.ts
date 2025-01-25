import BaseVideoExtractor from "../../types/impl/extractors/impl/baseVideoExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";

export class StreamSB extends BaseVideoExtractor {
    protected server: StreamingServers = StreamingServers.StreamSB;

    public async extract(): Promise<ISource> {
        throw new Error("Method not implemented.");
    }
}
