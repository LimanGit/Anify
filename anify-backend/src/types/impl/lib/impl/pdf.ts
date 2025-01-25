export interface IPDFCredentials {
    email: string;
    key: string;
}

export interface IPDFUploadStatus {
    success: true;
    result: {
        [key: string]: IPDFFileData;
    };
}

export interface IPDFFileData {
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
