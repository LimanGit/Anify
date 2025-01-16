export async function loadJSON<T>(filePath: string): Promise<T> {
    try {
        const file = Bun.file(filePath);
        if (!(await file.exists())) {
            return [] as unknown as T;
        }
        return (await file.json()) as T;
    } catch (err) {
        console.error(err);
        return [] as unknown as T;
    }
}
