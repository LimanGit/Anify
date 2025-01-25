import { emitter } from "../../../events";
import { BASE_PROVIDERS } from "../../../mappings";
import { MediaFormat, MediaType } from "../../../types";
import { Events } from "../../../types/impl/events";
import { raceNonNull } from "./impl/raceNonNull";

const loadSeasonal = async (data: { type: MediaType; formats: MediaFormat[] }) => {
    // Create an array of promises, each of which either:
    //   - returns seasonal data if the provider’s format(s) matches, or
    //   - returns null otherwise
    const fetchPromises = BASE_PROVIDERS.map(async (createProvider) => {
        const provider = await createProvider();
        // Quick check: if this provider doesn't handle the requested format(s), skip it
        const canHandle = provider.formats?.some((f) => data.formats.includes(f));
        if (!canHandle) return null;

        // Otherwise fetch seasonal
        return provider.fetchSeasonal(data.type, data.formats);
    });

    // Race them all in parallel, but short-circuit on the first valid, non-null result
    const result = await raceNonNull(fetchPromises);

    // Notify listeners, even if result is null (meaning nobody could fetch)
    emitter.emit(Events.COMPLETED_SEASONAL_LOAD, result);

    return result;
};

export default loadSeasonal;
