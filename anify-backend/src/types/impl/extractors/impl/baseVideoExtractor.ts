import type { IVideoExtractor } from "..";
import type { ISource, StreamingServers } from "../../mappings/impl/anime";

export default abstract class BaseVideoExtractor implements IVideoExtractor {
    protected abstract server: StreamingServers;
    abstract extract(url: string, ...args: any): Promise<ISource | undefined>;
}
