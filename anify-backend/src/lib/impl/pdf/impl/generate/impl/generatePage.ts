import { getImageSize } from "./utils";
import { env } from "../../../../../../env";
import colors from "colors";

export const generatePage = async (doc: PDFKit.PDFDocument, pagesDir: string, file: string) => {
    const result = await getImageSize(`${pagesDir}/${file}`).catch(() => {
        return null;
    });

    if (!result) {
        return;
    }

    let width = result.width ?? 0;
    let height = result.height ?? 0;
    const ratio = (width + height) / 2;
    const a7Ratio = 338.266666661706;
    const scale = a7Ratio / ratio;

    width = width * scale;
    height = height * scale;

    try {
        doc.addPage({ size: [width, height] }).image(`${pagesDir}/${file}`, 0, 0, {
            align: "center",
            valign: "center",
            width: width,
            height: height,
        });
    } catch {
        if (env.DEBUG) {
            console.log(colors.red("Unable to add page ") + colors.blue(file + "") + colors.red(" to PDF."));
        }
    }
};
