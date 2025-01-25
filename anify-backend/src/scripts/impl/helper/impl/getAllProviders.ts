import { PROVIDERS } from "../../../../mappings";
import { MediaProvider } from "../../../../types/impl/mappings/impl/mediaProvider";

export async function getAllProviders(): Promise<MediaProvider[]> {
    // This is a simple function that resolves all the providers
    // If `PROVIDERS` is already a Promise, we can just do:
    const resolvedProviders = await PROVIDERS;
    return Promise.all(resolvedProviders.map(async (p) => await p));
}
