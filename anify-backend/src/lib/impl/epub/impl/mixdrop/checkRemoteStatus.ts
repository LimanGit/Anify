import type { IEpubCredentials, IEpubUploadStatus } from "../../../../../types/impl/lib/impl/epub";

export const checkRemoteStatus = async (credentials: IEpubCredentials, mixdrop: string): Promise<IEpubUploadStatus> => {
    const mixdropEmail = credentials.email;
    const mixdropKey = credentials.key;

    const res = (await (await fetch(`https://api.mixdrop.ag/fileinfo2?email=${mixdropEmail}&key=${mixdropKey}&ref[]=${mixdrop}`)).json()) as IEpubUploadStatus;
    return res;
};
