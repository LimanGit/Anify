import type { IManga } from "../../../../../../types/impl/database/impl/schema/manga";
import type { ImageFile } from "../../../../../../types/impl/lib/impl/epub";
import { exists, mkdir, unlink } from "node:fs/promises";

export const getSafeFileName = (title: string): string => {
    return title.replace(/[^\w\d .-]/gi, "_").replace(/ /g, "_");
};

export const getMediaTitle = (media: IManga): string => {
    return media.title?.english ?? media.title?.romaji ?? media.title?.native ?? "";
};

export const setupDirectory = async (dir: string): Promise<void> => {
    if (!(await exists(dir))) {
        await mkdir(dir, { recursive: true });
    }
};

export const downloadCoverImage = async (media: IManga, dir: string): Promise<void> => {
    if (!media.coverImage) return;

    const cover = await fetch(media.coverImage);
    if (cover.ok) {
        await Bun.write(`${dir}/cover.jpg`, await cover.arrayBuffer());
    }
};

export const cleanupImageFiles = async (dir: string, imageFiles: ImageFile): Promise<void> => {
    for (const img in imageFiles) {
        try {
            await unlink(`${dir}/${img}`);
        } catch (err) {
            console.log(err);
        }
    }
};
