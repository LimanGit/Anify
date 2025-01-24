import colors from "colors";
import QueueExecutor from "./helper/impl/executor";
import type { IChapter } from "../../types";
import type { IManga } from "../../types/impl/database/impl/schema/manga";
import lib from "../../lib";
import type { IPage } from "../../types/impl/mappings/impl/manga";

const executor = new QueueExecutor<{ media: IManga; providerId: string; chapter: IChapter; pages: IPage[] }>("pdf-executor")
    .executor(async (data) => {
        const media = await lib.loadPDF(data);
        return media;
    })
    .callback((data) => console.debug(colors.green(`Finished generating PDF for ${data.media.id} chapter ${data.chapter.id}.`)))
    .error((err, data) => console.error(colors.red(`Error occurred while generating PDF for ${data.media.id} chapter ${data.chapter.id}.`), err))
    .interval(1000);
export default executor;
