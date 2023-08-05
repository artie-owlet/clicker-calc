import parseDuration from 'parse-duration';
import {
    IConversion,
    IConversionInput,
    IConversionOutcome,
    IConversionWin,
    IGameConfig,
} from './game-config';

class VerificationError extends Error {}

/* c8 ignore start */
class BugError extends Error {
    constructor(msg: string) {
        super(`BUG: ${msg}`);
    }
}
/* c8 ignore stop */

type Item = {
    amount: number;
    max?: number;
};

function getItem(name: string, items: Map<string, Item>): Item {
    const item = items.get(name);
    /* c8 ignore start */
    if (!item) {
        throw new VerificationError(`No such item ${name}`);
    }
    /* c8 ignore stop */
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
        /* c8 ignore start */
        if (this.item.amount < 0) {
            this.item.amount = 0;
        }
        /* c8 ignore stop */
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
        /* c8 ignore start */
        if (!outcome) {
            throw new BugError('no outcome');
        }
        /* c8 ignore stop */
        outcome.payWins();
    }
}

class PeriodConversion extends Conversion {
    public nextExecTime: number;
    private period: number;

    constructor(conv: Required<IConversion>, items: Map<string, Item>) {
        super(conv, items);

        const ms = parseDuration(conv.period);
        /* c8 ignore start */
        if (ms === undefined) {
            throw new VerificationError(`Invalid conversion period ${conv.period}`);
        }
        /* c8 ignore stop */
        this.period = Math.floor(ms / 1000);
        this.nextExecTime = this.period;
    }

    public override execute(): void {
        super.execute();
        this.nextExecTime += this.period;
    }

    public reset(): void {
        this.nextExecTime = this.period;
    }
}

export class Game {
    private items = new Map<string, Item>();
    private initAmounts: Record<string, number>;
    private conversions: Conversion[] = [];
    private periodConversions: PeriodConversion[] = [];

    constructor(config: IGameConfig) {
        config.items.forEach(name => this.items.set(name, { amount: 0 }));
        for (const name in config.itemsMax) {
            this.items.set(name, { amount: 0, max: config.itemsMax[name] });
        }
        for (const name in config.initAmounts) {
            const item = getItem(name, this.items);
            item.amount = config.initAmounts[name];
        }
        this.initAmounts = config.initAmounts;

        config.conversions.forEach((conv) => {
            if (conv.period) {
                this.periodConversions.push(new PeriodConversion(conv as Required<IConversion>, this.items));
            } else {
                this.conversions.push(new Conversion(conv, this.items));
            }
        });
    }

    public simulate(maxTime: number): void {
        let time = 0;
        do {
            this.periodConversions.forEach((conv) => {
                if (conv.nextExecTime === time) {
                    conv.execute();
                }
            });

            let availableConversions: Conversion[] = [];
            do {
                availableConversions = this.conversions.filter(conv => conv.canExecute());
                availableConversions.forEach(conv => conv.execute());
            } while (availableConversions.length > 0);

            time = this.periodConversions.reduce(
                (t, conv) => conv.canExecute() && conv.nextExecTime < t ? conv.nextExecTime : t, maxTime);
        } while (time < maxTime);
    }

    public reset(): void {
        this.items.forEach((item, name) => item.amount = this.initAmounts[name] ?? 0);
        this.periodConversions.forEach(conv => conv.reset());
    }

    public result(): Map<string, number> {
        const res = new Map<string, number>();
        this.items.forEach((item, name) => res.set(name, item.amount));
        return res;
    }
}

