import { MediaProvider } from "../../../types/impl/mappings/impl/mediaProvider";
import { type IChapter, type IEpisode, MediaFormat, ProviderType } from "../../../types";
import type { IMedia } from "../../../types/impl/mappings";
import type { AnimeInfo, MangaInfo, MediaInfoKeys } from "../../../types/impl/mappings/impl/mediaInfo";

export default abstract class InformationProvider<T extends IMedia, U extends AnimeInfo | MangaInfo> extends MediaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: MediaFormat[];

    public providerType: ProviderType = ProviderType.INFORMATION;
    public preferredTitle: "english" | "romaji" | "native" = "english";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async info(media: T): Promise<U | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchContentData(media: T): Promise<IEpisode[] | IChapter[] | undefined> {
        return undefined;
    }

    get priorityArea(): MediaInfoKeys[] {
        return [];
    }

    get sharedArea(): MediaInfoKeys[] {
        return [];
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async proxyCheck(_proxyUrl: string): Promise<boolean | undefined> {
        return undefined;
    }
}
