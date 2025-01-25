import colors from "colors";
import QueueExecutor from "./helper/impl/executor";
import type { IChapter } from "../../types";
import type { IManga } from "../../types/impl/database/impl/schema/manga";
import lib from "../../lib";

const executor = new QueueExecutor<{ media: IManga; providerId: string; chapters: IChapter[] }>("epub-executor")
    .executor(async (data) => {
        const media = await lib.loadEpub(data);
        return media;
    })
    .callback((data) => console.debug(colors.green(`Finished generating epub for ${data.media.id}`)))
    .error((err, data) => console.error(colors.red(`Error occurred while generating epub for ${data.media.id}`), err))
    .interval(1000);
export default executor;
