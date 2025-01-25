import { MediaProvider } from "../../../../types/impl/mappings/impl/mediaProvider";
import { ProviderType } from "../../../../types";
import { getAllProviders } from "./getAllProviders";

export async function getProviderById(id: string, providerType: ProviderType): Promise<MediaProvider | undefined> {
    const allProviders = await getAllProviders();
    return allProviders.find((provider) => provider.id === id && provider.providerType === providerType);
}
