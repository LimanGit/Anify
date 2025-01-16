import mappingQueue from "./impl/mappings";
import seasonalQueue from "./impl/seasonal";
import proxyQueue from "./impl/proxies";

export const init = () => {
    mappingQueue.start();
    seasonalQueue.start();
    proxyQueue.start();
};

export default {
    mappingQueue,
    seasonalQueue,
    proxyQueue,
};
