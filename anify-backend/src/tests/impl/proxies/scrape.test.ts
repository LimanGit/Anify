import { expect, test } from "bun:test";
import proxies from "../../../proxies/impl/manager/impl/scrape";
import { env } from "../../../env";

test(
    "Proxies.Scrape",
    async (done) => {
        for (const proxy of Object.values(proxies)) {
            const data = await proxy();
            if (env.DEBUG) {
                console.log(data);
            }
            expect(data).not.toBeEmpty();
        }

        done();
    },
    {
        timeout: 30000,
    },
);
