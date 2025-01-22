import type { IChapter } from "../../../../../types";
import type { IManga } from "../../../../../types/impl/database/impl/schema/manga";
import { env } from "../../../../../env";
import { join } from "node:path";
import { exists, unlink } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import colors from "colors";
import { getMediaTitle, getSafeFileName, setupDirectory } from "./impl/utils";
import type { IPage } from "../../../../../types/impl/mappings/impl/manga";
import { downloadPages } from "./impl/downloadPages";
import PDFDocument from "pdfkit";
import { readPages } from "./impl/readPages";
import { generatePage } from "./impl/generatePage";

export const generatePDF = async (media: IManga, providerId: string, chapter: IChapter, pages: IPage[]): Promise<string | null> => {
    if (chapter.title.length === 0) Object.assign(chapter, { title: `Chapter ${chapter.number}` });

    if (pages.length === 0) {
        if (env.DEBUG) {
            console.log(colors.red("No pages found for ") + colors.blue(getMediaTitle(media)));
        }
        return null;
    }

    const title = getMediaTitle(media);
    const safeTitle = getSafeFileName(chapter.title);

    const dir = join(import.meta.dir, `../manga/${providerId}/${title}`.slice(0, -1));
    const pdfPath = join(dir, `${safeTitle}.pdf`);

    if (await exists(pdfPath)) return pdfPath;

    if (env.DEBUG) {
        console.log(colors.green("Generating PDF for ") + colors.blue(chapter.title) + colors.green("..."));
    }

    await setupDirectory(dir);

    const pagesDir = await downloadPages(dir, pages);
    if (!pagesDir) return null;

    const doc = new PDFDocument({
        autoFirstPage: false,
    });

    doc.pipe(createWriteStream(pdfPath));

    const files = await readPages(pagesDir);

    for (let i = 0; i < files.length; i++) {
        const file = files[i][0];
        await generatePage(doc, pagesDir, file.toString());
    }
    doc.end();

    for (let i = 0; i < files.length; i++) {
        const file = files[i][0];
        const path = `${pagesDir}/${file}`;
        if (await exists(path)) {
            try {
                await unlink(path);
            } catch {
                if (env.DEBUG) {
                    console.log(colors.red("Unable to delete file ") + colors.blue(file + ".png") + colors.red("."));
                }
            }
        }
    }

    return pdfPath;
};
