import { ProviderType } from "../../../types";
import type { IProxy } from "../../../types/impl/proxies";

export const proxyCache: {
    proxies: IProxy[];
    validProxies: Record<ProviderType, Record<string, IProxy[]>>;
} = {
    proxies: [],
    validProxies: Object.values(ProviderType).reduce(
        (acc, type) => {
            acc[type] = {};
            return acc;
        },
        {} as Record<ProviderType, Record<string, IProxy[]>>,
    ),
};
