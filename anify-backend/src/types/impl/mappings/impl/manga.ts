export interface IPage {
    url: string;
    index: number;
    headers: { [key: string]: string };
}

/**
 * @description Enum for streaming servers that can be extracted.
 */
export const enum NovelProviders {
    ZetroTranslations = "zetrotranslations",
}
