import mappingQueue from "./impl/mappings";
import seasonalQueue from "./impl/seasonal";
import proxyQueue from "./impl/proxies";
import { env } from "../env";

export const init = () => {
    mappingQueue.start();
    seasonalQueue.start();
    if (env.PROXY_CRON_ENABLED) {
        proxyQueue.start();
    }
};

export default {
    mappingQueue,
    seasonalQueue,
    proxyQueue,
};
