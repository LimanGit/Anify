import { MediaFormat, MediaStatus, MediaType, ProviderType } from "../..";
import type { IArtwork, ICharacter, IRelations } from "../database/impl/mappings";
import type { IAnime } from "../database/impl/schema/anime";
import type { IManga } from "../database/impl/schema/manga";

export type IMedia = IAnime | IManga;

export interface ISeasonal {
    id: string;
    type: MediaType;
    format: MediaFormat;
}

export interface IMediaBase {
    id: string;
    slug: string | null;
    coverImage: string | null;
    bannerImage: string | null;
    status: MediaStatus | null;
    title: {
        romaji: string | null;
        english: string | null;
        native: string | null;
    } | null;
    mappings: { id: string; providerId: string; similarity: number; providerType: ProviderType | null }[];
    synonyms: string[];
    countryOfOrigin: string | null;
    description: string | null;
    color: string | null;
    year: number | null;
    rating: { [key: string]: number } | null;
    popularity: { [key: string]: number } | null;
    averageRating: number | null;
    averagePopularity: number | null;
    format: MediaFormat;
    relations: IRelations[];
    genres: string[];
    tags: string[];
    artwork: IArtwork[];
    characters: ICharacter[];
    createdAt: Date;
}
