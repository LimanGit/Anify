/**
 * @author Credit to https://github.com/image-size/image-size/tree/main
 */

import { typeHandlers, type ISizeCalculationResult, type ImageType } from "../../../types/impl/helper/image-size";
import { detector } from "./impl/detector";
import fs from "node:fs";
import path from "node:path";
import Queue from "../queue";

export const MAX_INPUT_SIZE = 512 * 1024;

const queue = new Queue({ concurrency: 100, autostart: true });

type CallbackFn = (e: Error | null, r?: ISizeCalculationResult) => void;
interface Options {
    disabledFS: boolean;
    disabledTypes: ImageType[];
}

const globalOptions: Options = {
    disabledFS: false,
    disabledTypes: [],
};

/**
 * Return size information based on an Uint8Array
 *
 * @param {Uint8Array} input
 * @param {String} filepath
 * @returns {Object}
 */

function lookup(input: Uint8Array, filepath?: string): ISizeCalculationResult {
    // detect the file type.. don't rely on the extension
    const type = detector(input);

    if (typeof type !== "undefined") {
        if (globalOptions.disabledTypes.indexOf(type) > -1) {
            throw new TypeError(`disabled file type: ${type}`);
        }

        // find an appropriate handler for this file type
        if (type in typeHandlers) {
            const size = typeHandlers[type].calculate(input, filepath);
            if (size !== undefined) {
                size.type = size.type ?? type;

                // If multiple images, find the largest by area
                if (size.images && size.images.length > 1) {
                    const largestImage = size.images.reduce((largest: ISizeCalculationResult, current: ISizeCalculationResult) => {
                        return current.width * current.height > largest.width * largest.height ? current : largest;
                    }, size.images[0]);

                    // Ensure the main result is the largest image
                    size.width = largestImage.width;
                    size.height = largestImage.height;
                }

                return size;
            }
        }
    }

    // throw up, if we don't understand the file
    throw new TypeError(`unsupported file type: ${type} (file: ${filepath})`);
}

/**
 * Reads a file into an Uint8Array.
 * @param {String} filepath
 * @returns {Promise<Uint8Array>}
 */
async function readFileAsync(filepath: string): Promise<Uint8Array> {
    const handle = await fs.promises.open(filepath, "r");
    try {
        const { size } = await handle.stat();
        if (size <= 0) {
            throw new Error("Empty file");
        }
        const inputSize = Math.min(size, MAX_INPUT_SIZE);
        const input = new Uint8Array(inputSize);
        await handle.read(input, 0, inputSize, 0);
        return input;
    } finally {
        await handle.close();
    }
}

/**
 * Synchronously reads a file into an Uint8Array, blocking the nodejs process.
 *
 * @param {String} filepath
 * @returns {Uint8Array}
 */
function readFileSync(filepath: string): Uint8Array {
    // read from the file, synchronously
    const descriptor = fs.openSync(filepath, "r");
    try {
        const { size } = fs.fstatSync(descriptor);
        if (size <= 0) {
            throw new Error("Empty file");
        }
        const inputSize = Math.min(size, MAX_INPUT_SIZE);
        const input = new Uint8Array(inputSize);
        fs.readSync(descriptor, input, 0, inputSize, 0);
        return input;
    } finally {
        fs.closeSync(descriptor);
    }
}

export default imageSize;
export function imageSize(input: Uint8Array | string): ISizeCalculationResult;
export function imageSize(input: string, callback: CallbackFn): void;

/**
 * @param {Uint8Array|string} input - Uint8Array or relative/absolute path of the image file
 * @param {Function=} [callback] - optional function for async detection
 */
export function imageSize(input: Uint8Array | string, callback?: CallbackFn): ISizeCalculationResult | undefined {
    // Handle Uint8Array input
    if (input instanceof Uint8Array) {
        return lookup(input);
    }

    // input should be a string at this point
    if (typeof input !== "string" || globalOptions.disabledFS) {
        throw new TypeError("invalid invocation. input should be a Uint8Array");
    }

    // resolve the file path
    const filepath = path.resolve(input);
    if (typeof callback === "function") {
        queue.push(() =>
            readFileAsync(filepath)
                .then((input) => process.nextTick(callback, null, lookup(input, filepath)))
                .catch(callback),
        );
    } else {
        const input = readFileSync(filepath);
        return lookup(input, filepath);
    }
}

export const disableFS = (v: boolean): void => {
    globalOptions.disabledFS = v;
};
export const disableTypes = (types: ImageType[]): void => {
    globalOptions.disabledTypes = types;
};
export const setConcurrency = (c: number): void => {
    queue.concurrency = c;
};
export const types = Object.keys(typeHandlers);
