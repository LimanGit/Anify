/**
 * @description Recursively sort object keys (case-insensitively) for stable comparison.
 * This ensures that objects differing only by key order or key casing are normalized.
 *
 * @param obj Object to sort keys of
 * @returns Object with sorted keys
 */
export function sortKeysDeep(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map((item) => sortKeysDeep(item));
    } else if (obj && typeof obj === "object") {
        const sortedKeys = Object.keys(obj).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
        const newObj: any = {};
        for (const key of sortedKeys) {
            newObj[key] = sortKeysDeep(obj[key]);
        }
        return newObj;
    }
    return obj;
}

/**
 * @description Normalize a default value into a stable form for comparison.
 *
 * Steps:
 * - Trim and unify cast expressions to lowercase (e.g., ::JSONB[], ::Jsonb -> ::jsonb).
 * - For JSON:
 *   - Remove JSON casts (::json, ::jsonb) and quotes.
 *   - Attempt to parse as JSON.
 *   - If parse succeeds, sort keys and re-stringify to ensure order-independence.
 *   - If parse fails, return the normalized string as-is.
 * - For non-JSON:
 *   - After normalizing casts, convert the value to lowercase for comparison.
 *
 * This ensures that differences in case or order of keys in JSON do not cause unnecessary syncs.
 */
export function normalizeDefaultValue(value: unknown, colType: string): string {
    if (value === null || value === undefined) return "";

    let strVal: string = typeof value === "string" ? value.trim() : String(value).trim();
    const isJSON = colType.toLowerCase().includes("json");

    // Normalize all casts to lowercase
    // This makes ::JSONB, ::Json, ::JSONB[] consistent as ::jsonb, ::json, ::jsonb[], etc.
    strVal = strVal.replace(/::[A-Za-z0-9_\[\]]+/g, (match) => match.toLowerCase());

    if (isJSON) {
        // Remove JSON-specific casts completely before parsing
        strVal = strVal.replace(/::jsonb$/i, "").replace(/::json$/i, "");

        // Remove surrounding quotes if present
        if (strVal.startsWith("'") && strVal.endsWith("'")) {
            strVal = strVal.slice(1, -1);
        }

        try {
            const parsed = JSON.parse(strVal);
            const sorted = sortKeysDeep(parsed);
            return JSON.stringify(sorted);
        } catch {
            // Not valid JSON; just return the normalized string as-is
            // This ensures that if default is some weird expression,
            // at least we compare after normalizing cast case.
            return strVal;
        }
    } else {
        // Non-JSON: just lowercase entire string for stable comparison
        // Also remove any quoted casts in non-JSON if present
        strVal = strVal
            .replace(/^'(.*)'::[\w\s\[\]]+$/, "$1")
            .toLowerCase()
            .trim();
        return strVal;
    }
}
