import { env } from "../../../env";
import { emitter } from "../../../events";
import { MediaStatus, type IChapter } from "../../../types";
import type { IManga } from "../../../types/impl/database/impl/schema/manga";
import { Events } from "../../../types/impl/events";
import type { IEpubCredentials } from "../../../types/impl/lib/impl/epub";
import { generateEpub } from "./impl/generate";
import { checkIfDeleted } from "./impl/mixdrop/checkIfDeleted";
import { uploadEpub } from "./impl/mixdrop/uploadEpub";

const loadEpub = async (data: { media: IManga; providerId: string; chapters: IChapter[] }) => {
    try {
        // Early validation of required environment variables
        if (!env.USE_MIXDROP || !env.MIXDROP_EMAIL || !env.MIXDROP_KEY) {
            return;
        }

        const credentials: IEpubCredentials = {
            email: env.MIXDROP_EMAIL,
            key: env.MIXDROP_KEY,
        };

        // Find existing chapter with mixdrop link
        const existingChapter = data.media.chapters.data.find((x) => x.providerId === data.providerId)?.chapters.find((x) => x.mixdrop);
        const existing = existingChapter?.mixdrop;

        if (!existing) {
            return await generateAndUploadEpub(data, credentials);
        }

        // Check if file is deleted on Mixdrop
        const isDeleted = await checkIfDeleted(credentials, existing);

        if (!isDeleted) {
            // Check if update is needed based on time criteria
            const shouldUpdate = checkUpdateCriteria(data.media);
            if (!shouldUpdate) return existing;
        }

        return await generateAndUploadEpub(data, credentials);
    } catch (error) {
        console.error("Error in loadEpub:", error);
        await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, "");
        return null;
    }
};

function checkUpdateCriteria(media: IManga): boolean {
    const { createdAt, chapters } = media;
    const updatedAt = chapters.latest.updatedAt;

    if (!updatedAt || updatedAt === 0) return true;
    if (new Date(createdAt).getTime() === new Date(updatedAt).getTime()) return true;

    const daysSinceUpdate = (Date.now() - updatedAt) / (1000 * 60 * 60 * 24);
    return daysSinceUpdate > 3 && media.status !== MediaStatus.FINISHED;
}

async function generateAndUploadEpub(data: { media: IManga; providerId: string; chapters: IChapter[] }, credentials: IEpubCredentials) {
    const epub = await generateEpub(data.media, data.providerId, data.chapters);
    if (!epub) {
        await emitter.emitAsync(Events.COMPLETED_NOVEL_UPLOAD, "");
        return;
    }

    await uploadEpub(epub, credentials, data.media);
    return epub;
}

export default loadEpub;
