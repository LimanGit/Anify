import { MediaProvider } from "../../../types/impl/mappings/impl/mediaProvider";
import { type IEpisode, type IProviderResult, MediaFormat, ProviderType } from "../../../types";
import type { IAnime } from "../../../types/impl/database/impl/schema/anime";
import { type IServer, type ISource, StreamingServers, SubType } from "../../../types/impl/mappings/impl/anime";

export default abstract class AnimeProvider extends MediaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: MediaFormat[];

    public providerType: ProviderType = ProviderType.ANIME;
    public preferredTitle: "english" | "romaji" | "native" = "english";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async search(query: string, format?: MediaFormat, year?: number): Promise<IProviderResult[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchEpisodes(id: string): Promise<IEpisode[] | undefined> {
        return undefined;
    }

    async fetchRecent(): Promise<IAnime[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchSources(id: string, subType: SubType = SubType.SUB, server: StreamingServers): Promise<ISource | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchServers(id: string, subType: SubType = SubType.SUB): Promise<IServer[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async proxyCheck(_proxyUrl: string): Promise<boolean | undefined> {
        return undefined;
    }

    abstract get subTypes(): SubType[];
    abstract get headers(): Record<string, string> | undefined;
}
