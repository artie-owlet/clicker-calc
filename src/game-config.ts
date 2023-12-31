export interface ILimitedItem {
    max: number;
}

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
    inputs: Record<string, IConversionInput>;
    outcomes: IConversionOutcome[];
    period?: string;
}

export interface IGameConfig {
    items: string[];
    itemsMax: Record<string, number>;
    conversions: IConversion[];
    initAmounts: Record<string, number>;
}
