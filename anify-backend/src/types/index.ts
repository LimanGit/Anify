/**
 * @fileoverview Main entry point for types. Contains frequently used types and enums.
 */

// ------------------- Types -------------------

/**
 * @description Provider search result.
 */
export interface IProviderResult {
    id: string;
    title: string;
    altTitles: string[];
    year: number;
    format: MediaFormat;
    img: string | null;
    providerId: string;
}

/**
 * @description Episode data.
 */
export interface IEpisode {
    id: string;
    title: string;
    number: number;
    isFiller: boolean;
    img: string | null;
    hasDub: boolean;
    description: string | null;
    rating: number | null;
    updatedAt?: number;
}

/**
 * @description Chapter data.
 */
export interface IChapter {
    id: string;
    title: string;
    number: number;
    rating: number | null;
    updatedAt?: number;
    mixdrop?: string;
}

// ------------------- Enums -------------------

/**
 * @description Provider type. Used for differentiating between different types of providers.
 * Anime providers search, fetch episodes, fetch source links, etc.
 * Manga providers search, fetch chapters, fetch pages/novel text, etc.
 * Information providers fetch metadata, such as genres, tags, etc.
 * Meta providers fetch metadata, such as ratings, popularity, etc.
 */
export enum ProviderType {
    ANIME = "ANIME",
    MANGA = "MANGA",
    META = "META",
    INFORMATION = "INFORMATION",
    BASE = "BASE",
}

/**
 * @description Media type. Used to differentiate between anime and manga.
 */
export enum MediaType {
    ANIME = "ANIME",
    MANGA = "MANGA",
}

/**
 * @description Media formats. Used to distinguish providers and media types.
 */
export enum MediaFormat {
    TV = "TV",
    TV_SHORT = "TV_SHORT",
    MOVIE = "MOVIE",
    SPECIAL = "SPECIAL",
    OVA = "OVA",
    ONA = "ONA",
    MUSIC = "MUSIC",
    MANGA = "MANGA",
    NOVEL = "NOVEL",
    ONE_SHOT = "ONE_SHOT",
    UNKNOWN = "UNKNOWN",
}

/**
 * @description Media season. Used for seasonal fetching and distinguishing
 * when a media was released.
 */
export enum MediaSeason {
    WINTER = "WINTER",
    SPRING = "SPRING",
    SUMMER = "SUMMER",
    FALL = "FALL",
    UNKNOWN = "UNKNOWN",
}

/**
 * @description Media status. Used to determine if a media is ongoing, finished, etc.
 */
export enum MediaStatus {
    FINISHED = "FINISHED",
    RELEASING = "RELEASING",
    NOT_YET_RELEASED = "NOT_YET_RELEASED",
    CANCELLED = "CANCELLED",
    HIATUS = "HIATUS",
}
