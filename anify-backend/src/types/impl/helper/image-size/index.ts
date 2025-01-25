import { BMP } from "./impl/bmp";
import { CUR } from "./impl/cur";
import { DDS } from "./impl/dds";
import { GIF } from "./impl/gif";
import { HEIF } from "./impl/heif";
import { ICNS } from "./impl/icns";
import { ICO } from "./impl/ico";
import { J2C } from "./impl/j2c";
import { JP2 } from "./impl/jp2";
import { JPG } from "./impl/jpg";
import { JXL } from "./impl/jxl";
import { JXLStream } from "./impl/jxl-stream";
import { KTX } from "./impl/ktx";
import { PNG } from "./impl/png";
import { PNM } from "./impl/pnm";
import { PSD } from "./impl/psd";
import { SVG } from "./impl/svg";
import { TGA } from "./impl/tga";
import { TIFF } from "./impl/tiff";
import { WEBP } from "./impl/webp";

export interface ISize {
    width: number;
    height: number;
    orientation?: number;
    type?: string;
}

export type ISizeCalculationResult = {
    images?: ISize[];
} & ISize;

export interface IImage {
    validate: (input: Uint8Array) => boolean;
    calculate: (input: Uint8Array, filepath?: string) => ISizeCalculationResult;
}

export const typeHandlers = {
    bmp: BMP,
    cur: CUR,
    dds: DDS,
    gif: GIF,
    heif: HEIF,
    icns: ICNS,
    ico: ICO,
    j2c: J2C,
    jp2: JP2,
    jpg: JPG,
    jxl: JXL,
    "jxl-stream": JXLStream,
    ktx: KTX,
    png: PNG,
    pnm: PNM,
    psd: PSD,
    svg: SVG,
    tga: TGA,
    tiff: TIFF,
    webp: WEBP,
};

export type ImageType = keyof typeof typeHandlers;
