import { db } from "../../../../database";
import { MangaRepository } from "../../../../database/impl/wrapper/impl/manga";
import type { IManga } from "../../../../types/impl/database/impl/schema/manga";
import type { IEpubCredentials } from "../../../../types/impl/lib/impl/epub";
import { unlink, readdir } from "fs/promises";
import colors from "colors";
import { emitter } from "../../../../events";
import { Events } from "../../../../types/impl/events";
import { checkRemoteStatus } from "./checkRemoteStatus";

export const uploadEpub = async (epub: string, credentials: IEpubCredentials, manga: IManga) => {
    const file = Bun.file(epub);
    if (!file.exists()) return await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, "");

    const form = new FormData();
    form.append("email", credentials.email);
    form.append("key", credentials.key);
    form.append("file", file);

    const result = (await (
        await fetch("https://ul.mixdrop.ag/api", {
            method: "POST",
            body: form,
        })
    ).json()) as { success: boolean; result?: { fileref: string } };

    if (result.success) {
        /**
         * @description Update the manga with the mixdrop fileref
         */
        for (const chap of manga.chapters.data) {
            Object.assign(chap, { mixdrop: result.result?.fileref });
        }

        await MangaRepository.updatePartially(db, manga.id, { chapters: manga.chapters });

        const maxThreshold = 100;
        let threshold = 0;

        const interval = setInterval(async () => {
            const isComplete = await checkRemoteStatus(credentials, result.result?.fileref ?? "");
            const key = Object.keys(isComplete.result)[0];

            if (isComplete.result[key].status === "OK") {
                console.log(colors.green("Completed uploading novel ") + colors.blue(manga.title?.english ?? manga.title?.romaji ?? manga.title?.native ?? "") + colors.green(" to Mixdrop"));
                try {
                    await unlink(epub);
                    // Try to delete parent folders
                    const parentFolder = epub.split("/").slice(0, -1).join("/");
                    if ((await readdir(parentFolder)).length === 0) {
                        await unlink(parentFolder);
                        const parentParentFolder = parentFolder.split("/").slice(0, -1).join("/");
                        if ((await readdir(parentParentFolder)).length === 0) {
                            await unlink(parentParentFolder);
                        }
                    }
                } catch {
                    //
                }

                clearInterval(interval);
                return;
            } else {
                if (threshold >= maxThreshold + 5) {
                    console.error(colors.red("ERROR: ") + colors.blue(`Mixdrop upload for ${manga.title?.english ?? manga.title?.romaji ?? manga.title?.native ?? ""} is taking too long.`));
                    try {
                        await unlink(epub);
                        // Try to delete parent folders
                        const parentFolder = epub.split("/").slice(0, -1).join("/");
                        if ((await readdir(parentFolder)).length === 0) {
                            await unlink(parentFolder);
                            const parentParentFolder = parentFolder.split("/").slice(0, -1).join("/");
                            if ((await readdir(parentParentFolder)).length === 0) {
                                await unlink(parentParentFolder);
                            }
                        }
                    } catch {
                        //
                    }

                    clearInterval(interval);
                    return;
                }
                threshold++;
            }
        }, 1000);

        await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, result.result?.fileref);
        return true;
    } else {
        console.log(result);
        console.error(colors.red("Failed to upload epub to Mixdrop."));
        return await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, false);
    }
};
