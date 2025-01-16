import colors from "colors";
import QueueExecutor from "./helper/impl/executor";
import { PROVIDERS } from "../../mappings";
import { checkProxies } from "../../proxies/impl/manager/impl/check";

const executor = new QueueExecutor<void>("proxy-executor")
    .selfRunning()
    .executor(async () => {
        // Get all providers that need proxies
        const providers = (await PROVIDERS).filter((provider) => provider.needsProxy);

        // Run proxy checks
        await checkProxies(providers);
    })
    .callback(() => console.debug(colors.green("Finished checking proxies for all providers")))
    .error((err) => console.error(colors.red("Error occurred while checking proxies:"), err))
    // Run every 2.5 hours (9,000,000 milliseconds)
    .interval(9000000);

export default executor;
