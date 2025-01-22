import type { IImage } from "..";
import { readInt32LE, readUInt32LE } from "../../../../../helper/impl/image-size/impl/utils";
import { toUTF8String } from "../../../../../helper/impl/image-size/impl/utils";

export const BMP: IImage = {
    validate: (input) => toUTF8String(input, 0, 2) === "BM",

    calculate: (input) => ({
        height: Math.abs(readInt32LE(input, 22)),
        width: readUInt32LE(input, 18),
    }),
};
