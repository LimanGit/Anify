import type { IPage } from "../../../../../../types/impl/mappings/impl/manga";
import { exists } from "node:fs/promises";
import { downloadFile } from "./utils";

export const downloadPages = async (dir: string, pages: IPage[]): Promise<string | null> => {
    const promises = [];
    for (let i = 0; i < pages.length; i++) {
        const request = new Promise(async (resolve) => {
            const link = pages[i].url;
            const page = pages[i].index;

            const pagePath = `${dir}/${page}.png`;

            if (link) {
                if (!(await exists(pagePath))) {
                    await downloadFile(link, pagePath, {
                        ...pages[i].headers,
                        Connection: "keep-alive",
                        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Accept-Encoding": "gzip, deflate, br",
                        Accept: "*/*",
                    });
                    resolve(true);
                } else {
                    resolve(true);
                }
            }
        });
        promises.push(request);
    }

    await Promise.all(promises);

    return dir;
};
