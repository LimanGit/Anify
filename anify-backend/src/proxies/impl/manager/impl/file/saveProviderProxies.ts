import { proxyCache } from "../..";
import { ProviderType } from "../../../../../types";
import { saveJSON } from "../../../helper/saveJSON";

export async function saveProviderProxies(providerType: ProviderType): Promise<void> {
    const fileName = `${providerType}Proxies.json`;
    await saveJSON(fileName, proxyCache.validProxies[providerType]);
}

export async function removeProviderProxy(providerType: ProviderType, providerId: string, proxyUrl: string): Promise<void> {
    const proxies = proxyCache.validProxies[providerType][providerId] || [];
    const [ip, port] = proxyUrl.replace("http://", "").split(":");

    // Remove the proxy from the cache
    proxyCache.validProxies[providerType][providerId] = proxies.filter((proxy) => !(proxy.ip === ip && proxy.port === Number(port)));

    // Save the updated proxy list
    await saveProviderProxies(providerType);
}
