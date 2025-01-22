import { readdirSync } from "node:fs";

export const readPages = async (parentFolder: string): Promise<(string | number)[][]> => {
    const images = readdirSync(parentFolder).filter((file) => file.endsWith(".png"));

    const files: (string | number)[][] = [];
    for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const a: string | number = file.split(".")[0];
        files.push([file, a ? a.toString() : ""]);
    }
    files.sort((a, b) => parseFloat(a[1].toString()) - parseFloat(b[1].toString()));

    return files;
};
