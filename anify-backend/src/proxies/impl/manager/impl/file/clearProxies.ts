import { saveJSON } from "../../../helper/saveJSON";
import { PROVIDERS } from "../../../../../mappings";

export async function clearProxies(clearProviderFiles: boolean = false): Promise<void> {
    // Clear main proxies file
    await saveJSON("proxies.json", []);

    // Only clear provider files if explicitly requested
    if (clearProviderFiles) {
        const providers = await Promise.all((await PROVIDERS).map((p) => p));
        for (const provider of providers) {
            const fileName = `${provider.providerType}Proxies.json`;
            const emptyProviderProxies: Record<string, any> = {};
            emptyProviderProxies[provider.id] = [];
            await saveJSON(fileName, emptyProviderProxies);
        }
    }
}
