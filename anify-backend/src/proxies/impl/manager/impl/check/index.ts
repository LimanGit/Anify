import { MediaProvider } from "../../../../../types/impl/mappings/impl/mediaProvider";
import proxies from "../scrape";
import colors from "colors";
import { runProxyChecks } from "./impl/runProxyChecks";
import { saveProxies } from "../file/saveProxies";
import { clearProxies } from "../file/clearProxies";
import { loadJSON } from "../../../helper/loadJSON";
import { ProviderType } from "../../../../../types";
import type { IProxy } from "../../../../../types/impl/proxies";
import { env } from "../../../../../env";
import { preloadProxies } from "../file/preloadProxies";

export const checkProxies = async (providers: MediaProvider[], verbose: boolean = false) => {
    // First clear all proxies
    await clearProxies();

    // Load and consolidate existing provider-specific proxies into proxies.json
    const providerTypes = Object.values(ProviderType);
    const allProviderProxies: IProxy[] = [];

    for (const providerType of providerTypes) {
        try {
            const fileName = `${providerType}Proxies.json`;
            const typeProxies = await loadJSON<Record<string, IProxy[]>>(fileName);

            // Collect all proxies from each provider
            Object.values(typeProxies).forEach((proxies) => {
                allProviderProxies.push(...proxies);
            });
        } catch {
            // Skip if file doesn't exist or is invalid
            continue;
        }
    }

    // Save consolidated proxies to proxies.json if any exist
    if (allProviderProxies.length > 0) {
        await saveProxies(allProviderProxies);
        if (env.DEBUG && verbose) {
            console.log(colors.green(`Consolidated ${allProviderProxies.length} existing proxies from provider files.`));
        }
    }

    // Now scrape for new proxies
    for (const scrape of Object.values(proxies)) {
        const data = await scrape();

        if (data.length === 0) {
            if (env.DEBUG && verbose) {
                console.log(colors.red("No proxies found, skipping proxy check"));
            }
            return;
        }

        await saveProxies(data);

        if (env.DEBUG && verbose) {
            console.log(colors.green(`Found ${data.length} proxies. Saved to file.`));
        }
    }

    // Preload the proxies into cache before running checks
    await preloadProxies();

    if (env.DEBUG && verbose) {
        console.log(colors.green(`Checking ${providers.map((p) => p.needsProxy).length} providers for proxy support.`));
    }

    await runProxyChecks(providers, verbose);
};
