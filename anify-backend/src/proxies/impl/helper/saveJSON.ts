export async function saveJSON<T>(filePath: string, data: T): Promise<void> {
    await Bun.write(filePath, JSON.stringify(data, null, 2));
}
