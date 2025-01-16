/**
 * @author Most of this is credited to shimizu.dev_ from the Anify Discord
 */

import type { IProviderResult } from "../../../../../types";
import type { IMatchResult } from "../../../../../types/impl/lib/impl/mappings";
import type { AnimeInfo, MangaInfo } from "../../../../../types/impl/mappings/impl/mediaInfo";
import { extractYear, getAllTitles, sanitizeTitle } from "./helper";
import { distance } from "fastest-levenshtein";

/**
 * Finds the best match between a target anime and a list of candidate anime.
 * @param {(AnimeInfo | MangaInfo) | undefined} target - The target anime to find a match for.
 * @param {IProviderResult[] | undefined} candidates - The list of candidate anime to match against.
 * @returns {IMatchResult | null} - The best match found, or null if no match was found.
 */
export function findBestMatch(target: (AnimeInfo | MangaInfo) | undefined, candidates: IProviderResult[] | undefined): IMatchResult | null {
    if (!target || !candidates || !candidates.length) return null;
    if (Object.values(target.title ?? {}).every((title) => !title)) return null;

    const targetTitles = getAllTitles(target.title).concat(target.synonyms ?? []);
    const targetYear = (target.year as number) || targetTitles.map(extractYear).find((y) => y !== null) || 0;
    const sanitizedTargetTitles = targetTitles.map(sanitizeTitle).filter((t): t is string => !!t);

    // 1. Try exact title match with year
    if (targetYear) {
        for (const candidate of candidates) {
            const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
            const candidateYear = (candidate.year as number) || candidateTitles.map(extractYear).find((y) => y !== null) || 0;

            if (candidateYear === targetYear) {
                for (const targetTitle of targetTitles) {
                    if (candidateTitles.includes(targetTitle)) {
                        return {
                            similarity: 1,
                            match: candidate,
                            matchType: "year-strict",
                            sanitizedTitle: "Unneeded",
                            matchedTitle: targetTitle,
                        };
                    }
                }
            }
        }
    }

    // 2. Try sanitized title match with year
    if (targetYear) {
        for (const candidate of candidates) {
            const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
            const candidateYear = (candidate.year as number) || candidateTitles.map(extractYear).find((y) => y !== null) || 0;
            const sanitizedCandidateTitles = candidateTitles.map(sanitizeTitle).filter((t): t is string => !!t);

            if (candidateYear === targetYear) {
                for (const sanitizedTargetTitle of sanitizedTargetTitles) {
                    if (sanitizedCandidateTitles.includes(sanitizedTargetTitle)) {
                        return {
                            similarity: 1,
                            match: candidate,
                            matchType: "year-loose",
                            sanitizedTitle: sanitizedTargetTitle,
                            matchedTitle: sanitizedTargetTitle,
                        };
                    }
                }
            }
        }
    }

    // 3. Try exact title match without year
    for (const candidate of candidates) {
        const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
        for (const targetTitle of targetTitles) {
            if (candidateTitles.includes(targetTitle)) {
                return {
                    similarity: 1,
                    match: candidate,
                    matchType: "strict",
                    sanitizedTitle: "Unneeded",
                    matchedTitle: targetTitle,
                };
            }
        }
    }

    // 4. Try sanitized title match without year
    for (const candidate of candidates) {
        const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
        const sanitizedCandidateTitles = candidateTitles.map(sanitizeTitle).filter((t): t is string => !!t);

        for (const sanitizedTargetTitle of sanitizedTargetTitles) {
            if (sanitizedCandidateTitles.includes(sanitizedTargetTitle)) {
                return {
                    similarity: 1,
                    match: candidate,
                    matchType: "loose",
                    sanitizedTitle: sanitizedTargetTitle,
                    matchedTitle: sanitizedTargetTitle,
                };
            }
        }
    }

    // 5. Try loose match with high similarity
    let bestMatch: IMatchResult | null = null;
    for (const candidate of candidates) {
        const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
        const sanitizedCandidateTitles = candidateTitles.map(sanitizeTitle).filter((t): t is string => !!t);

        for (const sanitizedTargetTitle of sanitizedTargetTitles) {
            for (const sanitizedCandidateTitle of sanitizedCandidateTitles) {
                const dist = distance(sanitizedCandidateTitle, sanitizedTargetTitle);
                const maxLength = Math.max(sanitizedCandidateTitle.length, sanitizedTargetTitle.length);
                const similarity = 1 - dist / maxLength;

                if (similarity >= 0.8 && (!bestMatch || similarity > bestMatch.similarity)) {
                    bestMatch = {
                        similarity,
                        match: candidate,
                        matchType: "loose",
                        sanitizedTitle: sanitizedTargetTitle,
                        matchedTitle: sanitizedCandidateTitle,
                    };
                }
            }
        }
    }

    if (bestMatch) return bestMatch;

    // 6. Try partial match as last resort
    let highestSimilarity = 0;
    let partialMatch: IProviderResult | null = null;
    let bestSanitizedTargetTitle = "";
    let bestSanitizedCandidateTitle = "";

    for (const candidate of candidates) {
        const candidateTitles = getAllTitles(candidate.title).concat(candidate.altTitles);
        const sanitizedCandidateTitles = candidateTitles.map(sanitizeTitle).filter((t): t is string => !!t);

        for (const sanitizedTargetTitle of sanitizedTargetTitles) {
            for (const sanitizedCandidateTitle of sanitizedCandidateTitles) {
                const dist = distance(sanitizedCandidateTitle, sanitizedTargetTitle);
                const maxLength = Math.max(sanitizedCandidateTitle.length, sanitizedTargetTitle.length);
                const similarity = 1 - dist / maxLength;

                if (similarity > highestSimilarity && similarity >= 0.6) {
                    highestSimilarity = similarity;
                    partialMatch = candidate;
                    bestSanitizedTargetTitle = sanitizedTargetTitle;
                    bestSanitizedCandidateTitle = sanitizedCandidateTitle;
                }
            }
        }
    }

    if (partialMatch) {
        return {
            similarity: highestSimilarity,
            match: partialMatch,
            matchType: "partial",
            sanitizedTitle: bestSanitizedTargetTitle,
            matchedTitle: bestSanitizedCandidateTitle,
        };
    }

    return null;
}
