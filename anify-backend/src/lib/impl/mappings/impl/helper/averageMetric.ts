export const averageMetric = (object: any) => {
    let average = 0,
        validCount = 0;
    if (!object) return 0;

    for (const [, v] of Object.entries(object)) {
        if (v && typeof v === "number") {
            average += v;
            validCount++;
        }
    }

    return validCount === 0 ? 0 : Number.parseFloat((average / validCount).toFixed(2));
};
