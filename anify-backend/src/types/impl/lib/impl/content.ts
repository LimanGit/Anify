import type { IChapter, IEpisode } from "../../..";

export interface IContentMetadata {
    providerId: string;
    data: IEpisode[] | IChapter[];
}
