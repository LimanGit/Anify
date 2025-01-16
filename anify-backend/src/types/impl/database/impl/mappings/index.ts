/**
 * @fileoverview Database mapping types used globally for media data.
 */

import { type IChapter, type IEpisode, MediaFormat, MediaType } from "../../../..";

/**
 * @description Content relations.
 */
export interface IRelations {
    id: string;
    type: MediaType;
    title: {
        english: string | null;
        romaji: string | null;
        native: string | null;
    };
    format: MediaFormat;
    relationType: string;
}

/**
 * @description Media artwork.
 */
export interface IArtwork {
    type: "banner" | "poster" | "clear_logo" | "top_banner" | "icon" | "clear_art";
    img: string;
    providerId: string;
}

/**
 * @description Character data.
 */
export interface ICharacter {
    name: string;
    image: string;
    voiceActor: {
        name: string;
        image: string;
    };
}

/**
 * @description Episode data wrapper containing the provider ID and episode list.
 */
export interface IEpisodeData {
    providerId: string;
    episodes: IEpisode[];
}

/**
 * @description Chapter data wrapper containing the provider ID and chapter list.
 */
export interface IChapterData {
    providerId: string;
    episodes: IChapter[];
}
