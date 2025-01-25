import type { INovelExtractor } from "..";
import { type IChapter, ProviderType } from "../../..";
import { getRandomProxy } from "../../../../proxies/impl/manager/impl/getRandomProxy";
import { customRequest } from "../../../../proxies/impl/request/customRequest";
import type { IPage, NovelProviders } from "../../mappings/impl/manga";
import type { IRequestConfig } from "../../proxies";

export default abstract class BaseNovelExtractor implements INovelExtractor {
    abstract url: string;

    protected server: NovelProviders | undefined;

    public needsProxy: boolean = false;

    abstract extract(url: string, chapter: IChapter | null, ...args: any): Promise<IPage[] | string | undefined>;

    async request(url: string, config: IRequestConfig = {}, proxyRequest: boolean = false): Promise<Response> {
        return (async () => {
            // same proxy logic
            const proxy = getRandomProxy(ProviderType.MANGA, "novelupdates");
            const useProxy = (config.proxy && config.proxy.length > 0) || proxyRequest || true;

            return customRequest(url, {
                proxy: useProxy ? (config.proxy && config.proxy.length > 0 ? config.proxy : (proxy ?? undefined)) : undefined,
                useGoogleTranslate: false,
                providerId: "novelupdates",
                providerType: ProviderType.MANGA,
                isChecking: false,
                ...config,
            });
        })();
    }
}
