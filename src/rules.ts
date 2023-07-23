export interface IConversionInput {
    amount: number;
    force?: boolean;
}

export interface IConversionWin {
    amount: number;
    totalLimit?: number;
}

export interface IConversionOutcome {
    freq: number;
    wins: Record<string, IConversionWin>;
}

export interface IConversion {
    name: string;
    inputs: Record<string, IConversionInput>;
    outcomes: IConversionOutcome[];
    period?: string;
}
