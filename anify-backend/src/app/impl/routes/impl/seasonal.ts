import { redis } from "../../..";
import { db } from "../../../../database";
import { MediaRepository } from "../../../../database/impl/wrapper/impl/media";
import { env } from "../../../../env";
import lib from "../../../../lib";
import { MediaFormat, MediaType } from "../../../../types";
import middleware from "../../middleware";

const handler = async (req: Request): Promise<Response> => {
    try {
        const url = new URL(req.url);
        const paths = url.pathname.split("/");
        paths.shift();

        const validTypes = ["anime", "manga", "novel"];

        const body =
            req.method === "POST"
                ? ((await req.json().catch(() => {
                      return null;
                  })) as Body)
                : null;

        const type = body?.type ?? paths[1] ?? url.searchParams.get("type") ?? null;
        if (!type) {
            return middleware.createResponse(JSON.stringify({ error: "No type provided." }), 400);
        } else if (!validTypes.includes(type.toLowerCase())) {
            return middleware.createResponse(JSON.stringify({ error: "Invalid type provided." }), 400);
        }

        let fields: string[] = body?.fields ?? [];
        const fieldsParam = url.searchParams.get("fields");

        if (fieldsParam && fieldsParam.startsWith("[") && fieldsParam.endsWith("]")) {
            const fieldsArray = fieldsParam
                .slice(1, -1)
                .split(",")
                .map((field) => field.trim());
            fields = fieldsArray.filter(Boolean);
        }

        const cached = await redis.get(`seasonal:${type}:${fields.join(",")}`);
        if (cached) {
            return middleware.createResponse(cached);
        }

        const formats = type.toLowerCase() === "anime" ? [MediaFormat.MOVIE, MediaFormat.TV, MediaFormat.TV_SHORT, MediaFormat.OVA, MediaFormat.ONA, MediaFormat.OVA] : type.toLowerCase() === "manga" ? [MediaFormat.MANGA, MediaFormat.ONE_SHOT] : [MediaFormat.NOVEL];

        const data = await lib.loadSeasonal({
            type: (type.toLowerCase() === "novel" ? MediaType.MANGA : type.toUpperCase()) as MediaType,
            formats,
        });

        const itemsToFetch: Array<{ type: MediaType; id: string; formats: [MediaFormat] }> = [];
        data?.trending?.forEach((x) => {
            itemsToFetch.push({
                type: x.type,
                id: x.id,
                formats: [x.format],
            });
        });
        data?.seasonal?.forEach((x) => {
            itemsToFetch.push({
                type: x.type,
                id: x.id,
                formats: [x.format],
            });
        });
        data?.popular?.forEach((x) => {
            itemsToFetch.push({
                type: x.type,
                id: x.id,
                formats: [x.format],
            });
        });
        data?.top?.forEach((x) => {
            itemsToFetch.push({
                type: x.type,
                id: x.id,
                formats: [x.format],
            });
        });

        // Remove duplicates
        const uniqueItems = itemsToFetch.filter((item, index, self) => index === self.findIndex((t) => t.id === item.id));

        const batchData = await MediaRepository.batchFetchWithFilter(db, uniqueItems);

        if (!data) {
            return middleware.createResponse(JSON.stringify({ error: "No data found." }), 404);
        }

        if (batchData.length !== 0) {
            await redis.set(`seasonal:${type}:${fields.join(",")}`, JSON.stringify(batchData), "EX", env.REDIS_CACHE_TIME);
        }

        return middleware.createResponse(JSON.stringify(batchData));
    } catch (e) {
        console.error(e);
        return middleware.createResponse(JSON.stringify({ error: "An error occurred." }), 500);
    }
};

const route = {
    path: "/seasonal",
    handler,
    rateLimit: 60,
};

type Body = {
    type: string;
    fields?: string[];
};

export default route;
