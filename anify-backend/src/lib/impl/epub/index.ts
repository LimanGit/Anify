import { env } from "../../../env";
import { emitter } from "../../../events";
import { MediaStatus, type IChapter } from "../../../types";
import type { IManga } from "../../../types/impl/database/impl/schema/manga";
import { Events } from "../../../types/impl/events";
import type { IEpubCredentials } from "../../../types/impl/lib/impl/epub";
import { checkIfDeleted } from "./impl/checkIfDeleted";
import { generateEpub } from "./impl/generateEpub";
import { uploadEpub } from "./impl/uploadEpub";

const loadEpub = async (data: { media: IManga; providerId: string; chapters: IChapter[] }) => {
    const useMixdrop = env.USE_MIXDROP;
    if (!useMixdrop) return;

    const credentials: IEpubCredentials = {
        email: env.MIXDROP_EMAIL || "",
        key: env.MIXDROP_KEY || "",
    };

    if (credentials.email.length === 0 || credentials.key.length === 0) return;

    /**
     * @description Check if we should generate an epub
     */
    const existing = data.media.chapters.data.find((x) => x.providerId === data.providerId)?.chapters.find((x) => x.mixdrop)?.mixdrop;

    const shouldGenerateEpub = !existing || (await checkIfDeleted(credentials, existing));
    if (!shouldGenerateEpub) {
        return;
    } else {
        const createdAt = data.media.createdAt;
        const updatedAt = data.media.chapters.latest.updatedAt;

        if (new Date(createdAt).getTime() !== new Date(updatedAt).getTime()) {
            if (updatedAt && updatedAt !== 0) {
                // Check if updatedAt is less than 7 days
                const now = Date.now();
                const diff = now - updatedAt;
                const days = Math.floor(diff / 1000 / 60 / 60 / 24);

                if (days <= 3 || data.media.status === MediaStatus.FINISHED) return existing;
            }
        }
    }

    /**
     * @description Generate the epub
     */
    const epub = await generateEpub(data.media, data.providerId, data.chapters);
    if (!epub) return await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, "");

    /**
     * @description Upload the epub to mixdrop
     */
    await uploadEpub(epub, credentials, data.media);

    return epub;
};

export default loadEpub;
