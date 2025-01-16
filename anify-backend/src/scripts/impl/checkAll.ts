import { checkProxies } from "../../proxies/impl/manager/impl/check";
import { preloadProxies } from "../../proxies/impl/manager/impl/file/preloadProxies";
import helper from "./helper";

export async function checkAll(verbose: boolean = false) {
    // Preload existing proxies (if needed)
    await preloadProxies();

    const providers = await helper.getAllProviders();
    await checkProxies(providers, verbose);
}
