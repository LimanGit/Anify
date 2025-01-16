import { load } from "cheerio";
import BaseExtractor from "../../types/impl/extractors/impl/baseExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";

export class Kwik extends BaseExtractor {
    protected server: StreamingServers = StreamingServers.Kwik;

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

        const host = "https://animepahe.com"; // Subject to change maybe.
        const req = await fetch(url, { headers: { Referer: host } });
        const match = load(await req.text())
            .html()
            .match(/p\}.*kwik.*/g);
        if (!match) {
            throw new Error("Video not found.");
        }
        let arr: string[] = match[0].split("return p}(")[1].split(",");

        const l = arr.slice(0, arr.length - 5).join("");
        arr = arr.slice(arr.length - 5, -1);
        arr.unshift(l);

        const [p, a, c, k, e] = arr.map((x) => x.split(".sp")[0]);

        const formatted = format(p, a, c, k, e, {});

        const source = formatted
            .match(/source=\\(.*?)\\'/g)[0]
            .replace(/\'/g, "")
            .replace(/source=/g, "")
            .replace(/\\/g, "");

        result.sources.push({
            url: source,
            quality: "auto",
        });

        return result;

        function format(p: any, a: any, c: any, k: any, e: any, d: any) {
            k = k.split("|");
            e = (c: any) => {
                return (c < a ? "" : e(parseInt((c / a).toString()))) + ((c = c % a) > 35 ? String.fromCharCode(c + 29) : c.toString(36));
            };
            if (!"".replace(/^/, String)) {
                while (c--) {
                    d[e(c)] = k[c] || e(c);
                }
                k = [
                    (e: any) => {
                        return d[e];
                    },
                ];
                e = () => {
                    return "\\w+";
                };
                c = 1;
            }
            while (c--) {
                if (k[c]) {
                    p = p.replace(new RegExp("\\b" + e(c) + "\\b", "g"), k[c]);
                }
            }
            return p;
        }
    }
}
