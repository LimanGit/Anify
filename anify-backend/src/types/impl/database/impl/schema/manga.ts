import { MediaType } from "../../../..";
import type { IMediaBase } from "../../../mappings";
import type { IChapterData } from "../mappings";

export interface IManga extends IMediaBase {
    type: MediaType.MANGA;
    currentChapter: number | null;
    chapters: {
        latest: {
            updatedAt: number;
            latestChapter: number;
            latestTitle: string;
        };
        data: IChapterData[];
    };
    totalChapters: number | null;
    totalVolumes: number | null;
    author: string | null;
    publisher: string | null;
}
