import colors from "colors";
import QueueExecutor from "./helper/impl/executor";
import { MediaFormat, MediaType } from "../../types";
import loadSeasonal from "../../lib/impl/seasonal";

const executor = new QueueExecutor<{ type: MediaType; formats: MediaFormat[] }>("season-executor")
    .executor(async (data) => {
        const media = await loadSeasonal(data);
        return media;
    })
    .callback((id) => console.debug(colors.green(`Finished fetching seasonal data ${id.type}.`)))
    .error((err, id) => console.error(colors.red(`Error occurred while fetching seasonal data ${id.type}.`), err))
    .interval(1000);
export default executor;
