import type { IExtractor } from "..";
import type { ISource, StreamingServers } from "../../mappings/impl/anime";

export default abstract class BaseExtractor implements IExtractor {
    protected abstract server: StreamingServers;
    abstract extract(url: string, ...args: any): Promise<ISource | undefined>;
}
