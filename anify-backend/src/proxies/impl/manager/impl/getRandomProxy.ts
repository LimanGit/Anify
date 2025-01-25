import { proxyCache } from "..";
import { ProviderType } from "../../../../types";

export function getRandomProxy(providerType: ProviderType, providerId: string): string | null {
    const providerProxies = proxyCache.validProxies[providerType][providerId] || [];
    if (providerProxies.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * providerProxies.length);
    const proxy = providerProxies[randomIndex];
    return `http://${proxy.ip}:${proxy.port}`;
}
