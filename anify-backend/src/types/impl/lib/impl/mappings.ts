import type { IProviderResult } from "../../..";

/**
 * Represents the result of a match between the target and a candidate anime.
 * @property {number} similarity - The similarity score between the target and the match.
 * @property {IAnimeResult} match - The matched anime result.
 * @property {"strict" | "loose" | "partial" | "year-strict" | "year-loose"} matchType - The type of match found.
 * @property {string} sanitizedTitle - The sanitized version of the target title that was matched.
 * @property {string} matchedTitle - The title from the candidate that matched.
 */
export interface IMatchResult {
    similarity: number;
    match: IProviderResult;
    matchType: "strict" | "loose" | "partial" | "year-strict" | "year-loose";
    sanitizedTitle: string;
    matchedTitle: string;
}

export interface IMappedResult {
    id: string;
    slug: string;
    data: IProviderResult;
    similarity: number;
}
