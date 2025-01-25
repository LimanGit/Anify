import BaseVideoExtractor from "../../types/impl/extractors/impl/baseVideoExtractor";
import { StreamingServers, type ISource } from "../../types/impl/mappings/impl/anime";
import { getSources } from "./megacloud";

export class VidCloud extends BaseVideoExtractor {
    protected server: StreamingServers = StreamingServers.VidCloud;

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

        const xrax = new URL(url).pathname.split("/").pop() || "";

        const resp = await getSources(xrax);
        if (!resp) return result;

        for (const source of resp.sources) {
            result.sources.push({
                quality: "auto",
                url: source.file,
            });
        }

        for (const track of resp.tracks) {
            result.subtitles.push({
                label: track.kind,
                lang: track.label ?? track.kind,
                url: track.file,
            });
        }

        result.intro.start = resp.intro.start;
        result.intro.end = resp.intro.end;

        result.outro.start = resp.outro.start;
        result.outro.end = resp.outro.end;

        return result;
    }
}
