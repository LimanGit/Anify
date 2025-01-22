import type { IPDFCredentials, IPDFUploadStatus } from "../../../../../types/impl/lib/impl/pdf";

export const checkRemoteStatus = async (credentials: IPDFCredentials, mixdrop: string): Promise<IPDFUploadStatus> => {
    const mixdropEmail = credentials.email;
    const mixdropKey = credentials.key;

    const res = (await (await fetch(`https://api.mixdrop.ag/fileinfo2?email=${mixdropEmail}&key=${mixdropKey}&ref[]=${mixdrop}`)).json()) as IPDFUploadStatus;
    return res;
};
