import type { IImage } from "../";
import { readUInt16LE } from "../../../../../helper/impl/image-size/impl/utils";

export const TGA: IImage = {
    validate(input) {
        return readUInt16LE(input, 0) === 0 && readUInt16LE(input, 4) === 0;
    },

    calculate(input) {
        return {
            height: readUInt16LE(input, 14),
            width: readUInt16LE(input, 12),
        };
    },
};
