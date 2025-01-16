import type { IProxy } from "../../../../../types/impl/proxies";
import { loadJSON } from "../../../helper/loadJSON";
import { saveJSON } from "../../../helper/saveJSON";

export async function saveProxies(proxies: IProxy[]): Promise<void> {
    const fileName = `proxies.json`;
    const currentData = await loadJSON<IProxy[]>(fileName);
    // Only save new proxies, remove duplicates
    const newData = currentData.concat(proxies.filter((p) => !currentData.some((c) => c.ip === p.ip && c.port === p.port)));
    await saveJSON(fileName, newData);
}
