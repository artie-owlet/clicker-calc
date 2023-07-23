import {
    IConversion,
    IConversionInput,
    IConversionOutcome,
    IConversionWin,
} from './rules';

type Item = {
    amount: number;
    max?: number;
};

class VerificationError extends Error {}

function getItem(name: string, items: Map<string, Item>): Item {
    const item = items.get(name);
    if (!item) {
        throw new VerificationError(`No such item ${name}`);
    }
    return item;
}

class ConversionInput {
    private amount: number;
    private force: boolean;

    constructor(
        private item: Item,
        input: IConversionInput,
    ) {
        this.amount = input.amount;
        this.force = input.force ?? false;
    }

    public canSpend(): boolean {
        return this.force || this.amount <= this.item.amount;
    }

    public spend(): void {
        this.item.amount -= this.amount;
        if (this.item.amount < 0) {
            this.item.amount = 0;
        }
    }
}

class ConversionWin {
    private amount: number;
    private totalLimit?: number;

    constructor(
        private item: Item,
        win: IConversionWin,
    ) {
        this.amount = win.amount;
        this.totalLimit = win.totalLimit;
    }

    public topUp(): void {
        if (this.totalLimit && this.item.amount + this.amount > this.totalLimit) {
            this.item.amount = this.totalLimit;
        } else {
            this.item.amount += this.amount;
        }

        if (this.item.max && this.item.amount > this.item.max) {
            this.item.amount = this.item.max;
        }
    }
}

class ConversionOutcome {
    public freqBegin: number;
    public freqEnd: number;
    private wins: ConversionWin[] = [];

    constructor(outcome: IConversionOutcome, prevFreqEnd: number, items: Map<string, Item>) {
        this.freqBegin = prevFreqEnd;
        this.freqEnd = this.freqBegin + outcome.freq;

        for (const itemName in outcome.wins) {
            const item = getItem(itemName, items);
            this.wins.push(new ConversionWin(item, outcome.wins[itemName]));
        }
    }
}

class Conversion {
    private inputs: ConversionInput[] = [];
    private outcomes: ConversionOutcome[] = [];
    private totalFreq = 0;

    constructor(conv: IConversion, items: Map<string, Item>) {
        for (const itemName in conv.inputs) {
            const item = getItem(itemName, items);
            this.inputs.push(new ConversionInput(item, conv.inputs[itemName]));
        }

        conv.outcomes.forEach((data) => {
            const outcome = new ConversionOutcome(data, this.totalFreq, items);
            this.outcomes.push(outcome);
            this.totalFreq = outcome.freqEnd;
        });
    }
}
