import type { IManga } from "../../../../../../types/impl/database/impl/schema/manga";
import type { IMangaWithCover } from "../../../../../../types/impl/lib/impl/epub";

export const generateMetadataContent = (media: IMangaWithCover): string => {
    return `
        <img src="file://${media.coverPath}">
        <p>${media.description ?? ""}</p>
        <br />
        <ul>
            <li><b>Author:</b> ${media.author ?? "Unknown"}</li>
            <li><b>Publisher:</b> ${media.publisher ?? "Unknown"}</li>
            <li><b>Total Volumes:</b> ${media.totalVolumes ?? "N/A"}</li>
            <li><b>Total Chapters:</b> ${media.totalChapters ?? "N/A"}</li>
            <li><b>Year Released:</b> ${media.year ?? "N/A"}</li>
            <li><b>Genres:</b> ${media.genres.join(", ")}</li>
            <li><b>Country:</b> ${media.countryOfOrigin ?? "Unknown"}</li>
            <li><b>Status:</b> ${media.status}</li>
        </ul>
        <br />
        <h4><b>Alternative Titles:</b></h4>
        <ul>
            <li><b>English:</b> ${media.title?.english ?? "N/A"}</li>
            <li><b>Japanese:</b> ${media.title?.native ?? "N/A"}</li>
            <li><b>Romaji:</b> ${media.title?.romaji ?? "N/A"}</li>
            <li><b>Synonyms</b>: ${media.synonyms.join(", ")}</li>
        </ul>
        <br />
        <h4><b>Links:</b></h4>
        <ul>
            ${generateMappingLinks(media)}
        </ul>
    `;
};

export const generateMappingLinks = (media: IManga): string => {
    return media.mappings
        .map((mapping) => {
            const links: { [key: string]: string } = {
                anilist: `https://anilist.co/manga/${mapping.id}`,
                mal: `https://myanimelist.net/manga/${mapping.id}`,
                kitsu: `https://kitsu.io/manga/${mapping.id}`,
                novelupdates: `https://novelupdates.com/series/${mapping.id}`,
            };

            const displayNames: { [key: string]: string } = {
                anilist: "AniList",
                mal: "MyAnimeList",
                kitsu: "Kitsu",
                novelupdates: "NovelUpdates",
            };

            const link = links[mapping.providerId];
            const name = displayNames[mapping.providerId];

            return link ? `<li><b>${name}:</b> <a href="${link}">${link}</a></li>` : "";
        })
        .join("");
};
