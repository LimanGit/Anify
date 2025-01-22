import { env } from "../../../env";
import { emitter } from "../../../events";
import { MediaStatus, type IChapter } from "../../../types";
import type { IManga } from "../../../types/impl/database/impl/schema/manga";
import { Events } from "../../../types/impl/events";
import type { IPDFCredentials } from "../../../types/impl/lib/impl/pdf";
import type { IPage } from "../../../types/impl/mappings/impl/manga";
import { generatePDF } from "./impl/generate";
import { checkIfDeleted } from "./impl/mixdrop/checkIfDeleted";
import { uploadPDF } from "./impl/mixdrop/uploadPDF";

const loadPDF = async (data: { media: IManga; providerId: string; chapter: IChapter; pages: IPage[] }) => {
    try {
        // Early validation of required environment variables
        if (!env.USE_MIXDROP || !env.MIXDROP_EMAIL || !env.MIXDROP_KEY) {
            return;
        }

        const credentials: IPDFCredentials = {
            email: env.MIXDROP_EMAIL,
            key: env.MIXDROP_KEY,
        };

        // Find existing chapter with mixdrop link
        const existingChapter = data.media.chapters.data.find((x) => x.providerId === data.providerId)?.chapters.find((x) => x.mixdrop);
        const existing = existingChapter?.mixdrop;

        if (!existing) {
            return await generateAndUploadPDF(data, credentials);
        }

        // Check if file is deleted on Mixdrop
        const isDeleted = await checkIfDeleted(credentials, existing);

        if (!isDeleted) {
            // Check if update is needed based on time criteria
            const shouldUpdate = checkUpdateCriteria(data.media);
            if (!shouldUpdate) return existing;
        }

        return await generateAndUploadPDF(data, credentials);
    } catch (error) {
        console.error("Error in loadPDF:", error);
        await emitter.emitAsync(Events.COMPLETED_MANGA_UPLOAD, "");
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

async function generateAndUploadPDF(data: { media: IManga; providerId: string; chapter: IChapter; pages: IPage[] }, credentials: IPDFCredentials) {
    const pdf = await generatePDF(data.media, data.providerId, data.chapter, data.pages);
    if (!pdf) {
        await emitter.emitAsync(Events.COMPLETED_MANGA_UPLOAD, "");
        return;
    }

    await uploadPDF(pdf, credentials, data.media);
    return pdf;
}

export default loadPDF;
