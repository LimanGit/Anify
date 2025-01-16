import { redis } from "../../..";
import { db } from "../../../../database";
import { MediaRepository } from "../../../../database/impl/wrapper/impl/media";
import { env } from "../../../../env";
import lib from "../../../../lib";
import middleware from "../../middleware";

const handler = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const paths = url.pathname.split("/");
        paths.shift();

        const body =
            req.method === "POST"
                ? ((await req.json().catch(() => {
                      return null;
                  })) as Body)
                : null;

        const id = body?.id ?? paths[1] ?? url.searchParams.get("id") ?? null;
        if (!id) {
            return middleware.createResponse(JSON.stringify({ error: "No ID provided." }), 400);
        }

        const cached = await redis.get(`content-metadata:${id}`);
        if (cached) {
            return middleware.createResponse(cached);
        }

        const media = await MediaRepository.getByIdAuto(db, id);
        console.log(media);
        if (!media) {
            return middleware.createResponse(JSON.stringify({ error: "Media not found." }), 404);
        }

        const data = await lib.content.loadMetadata(media);

        await redis.set(`content-metadata:${id}`, JSON.stringify(data), "EX", env.REDIS_CACHE_TIME);

        return middleware.createResponse(JSON.stringify(data));
    } catch (e) {
        console.error(e);
        return middleware.createResponse(JSON.stringify({ error: "An error occurred." }), 500);
    }
};

const route = {
    path: "/content-metadata",
    handler,
    rateLimit: 50,
};

type Body = {
    id: string;
};

export default route;
