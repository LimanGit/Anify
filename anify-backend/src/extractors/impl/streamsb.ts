import BaseExtractor from "../../types/impl/extractors/impl/baseExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";

export class StreamSB extends BaseExtractor {
    protected server: StreamingServers = StreamingServers.StreamSB;

    public async extract(): Promise<ISource> {
        throw new Error("Method not implemented.");
    }
}
