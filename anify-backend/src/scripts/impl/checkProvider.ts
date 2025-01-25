import { checkProxies } from "../../proxies/impl/manager/impl/check";
import { preloadProxies } from "../../proxies/impl/manager/impl/file/preloadProxies";
import { ProviderType } from "../../types";
import helper from "./helper";
import colors from "colors";

export async function checkProvider(providerId: string, providerType: ProviderType, verbose: boolean = false) {
    await preloadProxies();

    const provider = await helper.getProviderById(providerId, providerType);
    if (!provider) {
        console.log(colors.red(`Provider with ID "${providerId}" and provider type "${providerType}" not found.`));
        process.exit(1);
    }

    console.log(colors.green(`Checking proxies for provider "${providerId}" with provider type "${providerType}"...`));
    await checkProxies([provider], verbose);
}
