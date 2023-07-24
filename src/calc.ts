import parseDuration from 'parse-duration';
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

class BugError extends Error {
    constructor(msg: string) {
        super(`BUG: ${msg}`);
    }
}

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

    public payout(): void {
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

    public payWins(): void {
        this.wins.forEach(w => w.payout());
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

    public canExecute(): boolean {
        for (let i = 0; i < this.inputs.length; ++i) {
            if (!this.inputs[i].canSpend()) {
                return false;
            }
        }
        return true;
    }

    public execute(): void {
        this.inputs.forEach(input => input.spend());
        const rand = Math.floor(Math.random() * this.totalFreq);
        const outcome = this.outcomes.find(o => rand >= o.freqBegin && rand < o.freqEnd);
        if (!outcome) {
            throw new BugError('no outcome');
        }
        outcome.payWins();
    }
}

class PeriodConversion extends Conversion {
    public nextExecTime: number;
    private period: number;

    constructor(conv: Required<IConversion>, items: Map<string, Item>) {
        super(conv, items);

        const ms = parseDuration(conv.period);
        if (ms === undefined) {
            throw new VerificationError(`Invalid conversion period ${conv.period}`);
        }
        this.period = Math.floor(ms / 1000);
        this.nextExecTime = this.period;
    }

    public override execute(): void {
        super.execute();
        this.nextExecTime += this.period;
    }
}

export function simulate(maxTime: number, items: Map<string, Item>, convRules: IConversion[]): void {
    const conversions: Conversion[] = [];
    const periodConversions: PeriodConversion[] = [];
    convRules.forEach((conv) => {
        if (conv.period) {
            periodConversions.push(new PeriodConversion(conv as Required<IConversion>, items));
        } else {
            conversions.push(new Conversion(conv, items));
        }
    });

    let time = 0;
    do {
        periodConversions.forEach((conv) => {
            if (conv.nextExecTime === time) {
                conv.execute();
            }
        });

        let executed: boolean;
        do {
            executed = false;
            conversions.forEach((conv) => {
                if (conv.canExecute()) {
                    conv.execute();
                    executed = true;
                }
            });
        } while (executed);

        time = periodConversions.reduce(
            (t, conv) => conv.canExecute() && conv.nextExecTime < t ? conv.nextExecTime : t, maxTime);
    } while (time < maxTime);
}
