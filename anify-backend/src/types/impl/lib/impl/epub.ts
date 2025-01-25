import type { IManga } from "../../database/impl/schema/manga";

export interface ImageFile {
    [key: string]: ArrayBuffer;
}

export interface IMangaWithCover extends IManga {
    coverPath: string;
}

export interface IEpubCredentials {
    email: string;
    key: string;
}

export interface IEpubUploadStatus {
    success: true;
    result: {
        [key: string]: IEpubFileData;
    };
}

export interface IEpubFileData {
    fileref: string;
    title: string;
    size: string;
    duration: null;
    subtitle: boolean;
    isvideo: boolean;
    isaudio: boolean;
    added: string;
    status: string;
    deleted: boolean;
    thumb: null;
    url: string;
    yourfile: boolean;
}

export type Key = {
    id: string;
    key: string;
    requestCount: number;
    createdAt: number;
    updatedAt: number;
};
