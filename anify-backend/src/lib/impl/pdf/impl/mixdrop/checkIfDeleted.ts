import type { IPDFCredentials } from "../../../../../types/impl/lib/impl/pdf";

export const checkIfDeleted = async (credentials: IPDFCredentials, fileRef: string): Promise<boolean> => {
    let pages = 1;
    const initial = (await (await fetch(`https://api.mixdrop.ag/removed?email=${credentials.email}&key=${credentials.key}&page=1`)).json()) as { result: { fileref: string }[]; pages: number };
    if (!Array.isArray(initial.result)) return false;

    for (const file of initial.result) {
        if (file.fileref === fileRef) return true;
    }

    pages = initial.pages;

    for (let i = 2; i <= pages; i++) {
        const initial = (await (await fetch(`https://api.mixdrop.ag/removed?email=${credentials.email}&key=${credentials.key}&page=${i}`)).json()) as { result: { fileref: string }[]; pages: number };
        if (!Array.isArray(initial.result)) return false;

        for (const file of initial.result) {
            if (file.fileref === fileRef) return true;
        }
    }

    return false;
};
