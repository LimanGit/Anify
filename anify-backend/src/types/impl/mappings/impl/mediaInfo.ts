import { IAnime } from "../../database/impl/schema/anime";
import { IManga } from "../../database/impl/schema/manga";

export type AnimeInfo = Pick<
    IAnime,
    "id" | "title" | "artwork" | "synonyms" | "totalEpisodes" | "currentEpisode" | "bannerImage" | "coverImage" | "color" | "season" | "year" | "status" | "genres" | "description" | "format" | "duration" | "trailer" | "countryOfOrigin" | "tags" | "relations" | "characters" | "type"
> & {
    rating: number | null;
    popularity: number | null;
};

export type MangaInfo = Pick<
    IManga,
    "id" | "title" | "artwork" | "synonyms" | "totalChapters" | "bannerImage" | "coverImage" | "color" | "year" | "status" | "genres" | "description" | "format" | "totalVolumes" | "countryOfOrigin" | "tags" | "relations" | "characters" | "type" | "author" | "publisher"
> & {
    rating: number | null;
    popularity: number | null;
};

type SharedKeys<T, U> = {
    [K in keyof T]: K extends keyof U ? K : never;
}[keyof T];

export type MediaInfoKeys = SharedKeys<AnimeInfo, MangaInfo>;
