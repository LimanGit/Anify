export interface ISkipTime {
    id: string;
    episodes: {
        intro: {
            start: number;
            end: number;
        };
        outro: {
            start: number;
            end: number;
        };
        number: number;
    }[];
    createdAt: Date;
}
