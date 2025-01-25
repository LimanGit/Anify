import { saveProxies } from "../../../../proxies/impl/manager/impl/file/saveProxies";
import proxies from "../../../../proxies/impl/manager/impl/scrape";
import colors from "colors";

// Optional method to scrape proxies (and possibly add them to your storage).
// Here, we'll assume `proxies` is an object of scraping functions just like in your code.
export async function scrapeNewProxies() {
    let totalProxies = 0;
    for (const scrape of Object.values(proxies)) {
        const data = await scrape();
        if (data.length === 0) {
            console.log(colors.yellow("No proxies found from this source."));
            continue;
        }
        await saveProxies(data);
        totalProxies += data.length;
        console.log(colors.green(`Scraped and saved ${data.length} proxies.`));
    }

    if (totalProxies === 0) {
        console.log(colors.red("No new proxies were scraped from any source."));
        return;
    }

    console.log(colors.green(`Successfully scraped ${totalProxies} proxies in total.`));
}
