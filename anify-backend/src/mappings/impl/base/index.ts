import { MediaProvider } from "../../../types/impl/mappings/impl/mediaProvider";
import { MediaFormat, MediaSeason, MediaType, ProviderType } from "../../../types";
import type { ISeasonal } from "../../../types/impl/mappings";
import type { AnimeInfo, MangaInfo } from "../../../types/impl/mappings/impl/mediaInfo";

export default abstract class BaseProvider extends MediaProvider {
    abstract id: string;
    abstract url: string;
    abstract formats: MediaFormat[];

    public providerType: ProviderType = ProviderType.BASE;
    public preferredTitle: "english" | "romaji" | "native" = "english";

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async search(query: string, type: MediaType, formats: MediaFormat[], page: number, perPage: number): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        return undefined;
    }

    async searchAdvanced(
        query: string,
        type: MediaType,
        formats: MediaFormat[],
        page: number,
        perPage: number,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        genres: string[] = [],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        genresExcluded: string[] = [],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        season: MediaSeason = MediaSeason.UNKNOWN,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        year = 0,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tags: string[] = [],
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        tagsExcluded: string[] = [],
    ): Promise<AnimeInfo[] | MangaInfo[] | undefined> {
        return undefined;
    }

    getCurrentSeason(): MediaSeason {
        const month = new Date().getMonth();

        if ((month >= 0 && month <= 1) || month === 11) {
            return MediaSeason.WINTER;
        } else if (month >= 2 && month <= 4) {
            return MediaSeason.SPRING;
        } else if (month >= 5 && month <= 7) {
            return MediaSeason.SUMMER;
        } else {
            return MediaSeason.FALL;
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getMedia(id: string): Promise<AnimeInfo | MangaInfo | undefined> {
        return undefined;
    }

    async fetchSeasonal(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        type: MediaType,
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        formats: MediaFormat[],
    ): Promise<
        | {
              trending: ISeasonal[];
              seasonal: ISeasonal[];
              popular: ISeasonal[];
              top: ISeasonal[];
          }
        | undefined
    > {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async fetchIds(formats: MediaFormat[]): Promise<string[] | undefined> {
        return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async proxyCheck(_proxyUrl: string): Promise<boolean | undefined> {
        return undefined;
    }
}
