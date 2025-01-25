import { MediaSeason, MediaType } from "../../../..";
import type { IMediaBase } from "../../../mappings";
import type { IEpisodeData } from "../mappings";

export interface IAnime extends IMediaBase {
    type: MediaType.ANIME;
    season: MediaSeason;
    trailer: string | null;
    currentEpisode: number | null;
    episodes: {
        latest: {
            updatedAt: number;
            latestEpisode: number;
            latestTitle: string;
        };
        data: IEpisodeData[];
    };
    duration: number | null;
    totalEpisodes: number | null;
}
