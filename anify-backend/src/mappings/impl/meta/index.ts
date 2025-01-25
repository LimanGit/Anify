import { type IProviderResult, MediaFormat, ProviderType } from "../../../types";
import { MediaProvider } from "../../../types/impl/mappings/impl/mediaProvider";

export default abstract class MetaProvider extends MediaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: MediaFormat[];

    public providerType: ProviderType = ProviderType.META;
    public preferredTitle: "english" | "romaji" | "native" = "english";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async search(query: string, format?: MediaFormat, year?: number): Promise<IProviderResult[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async proxyCheck(_proxyUrl: string): Promise<boolean | undefined> {
        return undefined;
    }
}
