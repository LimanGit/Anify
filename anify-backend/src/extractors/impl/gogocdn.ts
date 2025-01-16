import { load } from "cheerio";
import BaseExtractor from "../../types/impl/extractors/impl/baseExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";
import CryptoJS from "crypto-js";

export class GogoCDN extends BaseExtractor {
    protected server: StreamingServers = StreamingServers.GogoCDN;

    public async extract(url: string): Promise<ISource> {
        const result: ISource = {
            sources: [],
            audio: [],
            headers: {},
            intro: {
                start: 0,
                end: 0,
            },
            outro: {
                start: 0,
                end: 0,
            },
            subtitles: [],
        };

        const keys = {
            key: CryptoJS.enc.Utf8.parse("37911490979715163134003223491201"),
            secondKey: CryptoJS.enc.Utf8.parse("54674138327930866480207815084989"),
            iv: CryptoJS.enc.Utf8.parse("3134003223491201"),
        };

        const req = await fetch(url);
        const $ = load(await req.text());

        const encyptedParams = await generateEncryptedAjaxParams(new URL(url).searchParams.get("id") ?? "");

        const encryptedData = await fetch(`${new URL(url).protocol}//${new URL(url).hostname}/encrypt-ajax.php?${encyptedParams}`, {
            headers: {
                "X-Requested-With": "XMLHttpRequest",
            },
        });

        const decryptedData = await decryptAjaxData(((await encryptedData.json()) as { data: any })?.data);
        if (!decryptedData.source) throw new Error("No source found. Try a different server.");

        if (decryptedData.source[0].file.includes(".m3u8")) {
            const resResult = await fetch(decryptedData.source[0].file.toString());
            const resolutions = (await resResult.text()).match(/(RESOLUTION=)(.*)(\s*?)(\s*.*)/g);

            resolutions?.forEach((res: string) => {
                const index = decryptedData.source[0].file.lastIndexOf("/");
                const quality = res.split("\n")[0].split("x")[1].split(",")[0];
                const url = decryptedData.source[0].file.slice(0, index);

                result.sources.push({
                    url: url + "/" + res.split("\n")[1],
                    quality: quality + "p",
                });
            });

            decryptedData.source.forEach((source: any) => {
                result.sources.push({
                    url: source.file,
                    quality: "default",
                });
            });
        } else {
            decryptedData.source.forEach((source: any) => {
                result.sources.push({
                    url: source.file,
                    quality: source.label.split(" ")[0] + "p",
                });
            });

            decryptedData.source_bk.forEach((source: any) => {
                result.sources.push({
                    url: source.file,
                    quality: "backup",
                });
            });
        }

        return result;

        function generateEncryptedAjaxParams(id: string) {
            const encryptedKey = CryptoJS.AES.encrypt(id, keys.key, {
                iv: keys.iv,
            });

            const scriptValue = $("script[data-name='episode']").data().value as string;

            const decryptedToken = CryptoJS.AES.decrypt(scriptValue, keys.key, {
                iv: keys.iv,
            }).toString(CryptoJS.enc.Utf8);

            return `id=${encryptedKey}&alias=${id}&${decryptedToken}`;
        }

        function decryptAjaxData(encryptedData: string) {
            const decryptedData = CryptoJS.enc.Utf8.stringify(
                CryptoJS.AES.decrypt(encryptedData, keys.secondKey, {
                    iv: keys.iv,
                }),
            );

            return JSON.parse(decryptedData);
        }
    }
}
