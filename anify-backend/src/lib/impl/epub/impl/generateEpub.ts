import { EPub, Chapter as EPubChapter } from "epub-gen-memory";
import type { IChapter } from "../../../../types";
import type { IManga } from "../../../../types/impl/database/impl/schema/manga";
import { env } from "../../../../env";
import { join } from "node:path";
import { exists, mkdir, unlink } from "node:fs/promises";
import colors from "colors";
import { MANGA_PROVIDERS } from "../../../../mappings";
import { load } from "cheerio";

export const generateEpub = async (media: IManga, providerId: string, chapters: IChapter[]): Promise<string | null> => {
    const content: EPubChapter[] = [];
    const imageFiles: { [key: string]: ArrayBuffer } = {};

    if (chapters.length === 0) {
        if (env.DEBUG) {
            console.log(colors.red("No chapters found for ") + colors.blue(media.title?.english ?? media.title?.romaji ?? media.title?.native ?? ""));
        }

        return null;
    }

    /**
     * @description Get the directory and epub file path.
     */
    const dir = join(import.meta.dir, `../manga/${providerId}/${(media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "").replace(/[^\w\d .-]/gi, "_").replace(/ /g, "_")}`.slice(0, -1));
    const epub = join(dir, `${(media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "").replace(/[^\w\d .-]/gi, "_").replace(/ /g, "_")}.epub`);

    if (await exists(epub)) return epub;

    if (env.DEBUG) {
        console.log(colors.green("Generating EPUB for ") + colors.blue(media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "") + colors.green("..."));
    }

    if (!(await exists(dir))) await mkdir(dir, { recursive: true });

    /**
     * @description Get the cover image and save it to the directory.
     */
    const cover = media.coverImage ? await fetch(media.coverImage) : null;
    if (cover && cover.ok) {
        await Bun.write(`${dir}/cover.jpg`, await cover.arrayBuffer());
    }

    /**
     * @description Add the metadata to the epub.
     */
    content.push({
        title: media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "",
        author: media.author ?? "",
        content: `
            <img src="file://${`${dir}/cover.jpg`}">
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
                ${media.mappings
                    .map((mapping) => {
                        switch (mapping.providerId) {
                            case "anilist":
                                return `<li><b>AniList:</b> <a href="https://anilist.co/manga/${mapping.id}">https://anilist.co/manga/${mapping.id}</a></li>`;
                            case "mal":
                                return `<li><b>MyAnimeList:</b> <a href="https://myanimelist.net/manga/${mapping.id}">https://myanimelist.net/manga/${mapping.id}</a></li>`;
                            case "kitsu":
                                return `<li><b>Kitsu:</b> <a href="https://kitsu.io/manga/${mapping.id}">https://kitsu.io/manga/${mapping.id}</a></li>`;
                            case "novelupdates":
                                return `<li><b>NovelUpdates:</b> <a href="https://novelupdates.com/series/${mapping.id}">https://novelupdates.com/series/${mapping.id}</a></li>`;
                        }
                    })
                    .join("")}
            </ul>
        `,
    });

    /**
     * @description Add the chapters to the epub.
     */
    let img_id = 0;
    for (const i in chapters) {
        const mangaProviders = await Promise.all(MANGA_PROVIDERS.map((factory) => factory()));
        const provider = mangaProviders.find((p) => p.id === providerId);
        if (!provider) continue;

        /**
         * @description Fetch the pages of the chapter.
         */
        const html = await provider.fetchPages(chapters[i].id, true, chapters[i]);
        if (!html || typeof html != "string") continue;

        const $ = load(html);

        /**
         * @description Find all images, download them, and replace the src with the local path.
         */
        const images = $("img");
        for (let j = 0; j < images.toArray().length; j++) {
            try {
                const imgName = `image_${img_id}.jpg`;

                const img_resp = await fetch(images.toArray()[j].attribs.src);
                if (img_resp.ok) {
                    // Generate a unique image ID
                    imageFiles[imgName] = await img_resp.arrayBuffer(); // Store image data
                    await Bun.write(`${dir}/${imgName}`, imageFiles[imgName]);

                    const newSource = `file://${`${dir}/${imgName}`}`;

                    $(images.toArray()[j]).replaceWith(`<img src="${newSource}">`);

                    console.log(colors.green("Added image ") + colors.blue(img_id.toString()) + colors.green(` to ${media.title?.english ?? media.title?.romaji ?? media.title?.native ?? ""}.`));
                    img_id++;
                } else {
                    console.log(colors.red("Failed to fetch image ") + colors.blue(img_id.toString()) + colors.red(` from ${media.title?.english ?? media.title?.romaji ?? media.title?.native ?? ""}.`));
                }
            } catch (err) {
                console.log(err);
            }
        }

        if (env.DEBUG) {
            console.log(colors.green("Added chapter ") + colors.blue(chapters[i].title) + colors.green(` to ${media.title?.english ?? media.title?.romaji ?? media.title?.native ?? ""}.`));
        }

        content.push({
            title: chapters[i].title,
            content: $.html().replace(/{{{/g, "<%=").replace(/}}}/g, "%>"),
        });
    }

    content.push({
        title: "Credits",
        content: `
            <p>Generated by <a href="https://anify.tv">Anify</a>.</p>
            <br />
            <p>Thanks for using Anify!</p>
        `,
    });

    const book = await new EPub(
        {
            title: media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "",
            cover: `file://${`${dir}/cover.jpg`}`,
            lang: "en",
            date: new Date(Date.now()).toDateString(),
            description: media.description ?? "",
            author: media.author ?? "",
            ignoreFailedDownloads: true,
        },
        content,
    ).genEpub();

    await Bun.write(epub, book);

    /**
     * @description Remove the image files from the directory.
     */
    for (const img in imageFiles) {
        try {
            await unlink(`${dir}/${img}`);
        } catch (err) {
            console.log(err);
        }
    }

    return epub;
};
