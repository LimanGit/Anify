import imageSize from "../../../../../../helper/impl/image-size";
import type { IManga } from "../../../../../../types/impl/database/impl/schema/manga";
import type { ImageFile } from "../../../../../../types/impl/lib/impl/epub";
import { createWriteStream } from "node:fs";
import { exists, mkdir, unlink } from "node:fs/promises";
import { pipeline } from "node:stream";
import { promisify } from "node:util";

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

export const cleanupImageFiles = async (dir: string, imageFiles: ImageFile): Promise<void> => {
    for (const img in imageFiles) {
        try {
            await unlink(`${dir}/${img}`);
        } catch (err) {
            console.log(err);
        }
    }
};

export const getImageSize = async (path: string): Promise<{ width: number; height: number } | null> => {
    try {
        const file = Bun.file(path);
        if (!file) return null;

        // Convert the Uint8Array to a Buffer
        const buffer = Buffer.from(await file.arrayBuffer());

        // Use image-size to get the image dimensions
        const dimensions = imageSize(buffer);

        if (dimensions.width && dimensions.height) {
            return { width: dimensions.width, height: dimensions.height };
        } else {
            return null; // Failed to get image dimensions
        }
    } catch {
        return null;
    }
};

/**
 * Downloads a file from the given URL and saves it to the specified local path.
 * @param url The URL of the file to download.
 * @param outputPath The local path where the file will be saved.
 * @param headers (Optional) Headers to be included in the HTTP request.
 * @returns A Promise that resolves when the download is complete.
 */
export const downloadFile = async (url: string, outputPath: string, headers?: Record<string, string>): Promise<void> => {
    try {
        const response = await fetch(url, { headers });

        if (!response.ok) {
            throw new Error(`Failed to download file from ${url}: ${response.statusText}`);
        }

        const pipelineAsync = promisify(pipeline);

        const writer = createWriteStream(outputPath) as NodeJS.WritableStream;

        const finishPromise = new Promise<void>((resolve, reject) => {
            writer.on("finish", () => resolve());
            writer.on("error", (err) => reject(err));
        });

        await pipelineAsync(response.body!, writer);

        await finishPromise;

        return;
    } catch {
        throw new Error(`Failed to download file from ${url}.`);
    }
};
