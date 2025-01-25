/**
 * Utility that 'races' an array of Promises but
 * resolves as soon as we get a non-null / non-undefined value.
 *
 * If *all* Promises resolve to null or undefined,
 * we end up resolving to null.
 */
export async function raceNonNull<T>(promises: Array<Promise<T | null | undefined>>): Promise<T | null> {
    return new Promise<T | null>((resolve, reject) => {
        let pending = promises.length;

        // If there are no promises at all, resolve immediately to null
        if (pending === 0) {
            resolve(null);
            return;
        }

        promises.forEach((p) => {
            p.then(
                (value) => {
                    // If we get a non-null response, short-circuit
                    if (value !== null && value !== undefined) {
                        resolve(value);
                    } else {
                        // Otherwise decrement pending.
                        // If nobody returned anything, resolve null in the end.
                        pending--;
                        if (pending === 0) {
                            resolve(null);
                        }
                    }
                },
                // If any provider throws, you can decide to short-circuit or just skip it.
                // Below we short-circuit on error, but feel free to handle differently.
                (err) => reject(err),
            );
        });
    });
}
