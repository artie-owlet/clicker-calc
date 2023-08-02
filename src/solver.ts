import { Game } from './game';
import { IGameConfig } from './game-config';

interface IVariable {
    getValue(): number;
    setValue(value: number): number;
}

class InputVariable implements IVariable {
    constructor(
        private config: IGameConfig,
        private convId: number,
        private item: string,
    ) {
    }

    public getValue(): number {
        return this.config.conversions[this.convId].inputs[this.item].amount;
    }

    public setValue(value: number): number {
        return this.config.conversions[this.convId].inputs[this.item].amount = value;
    }
}

class OutcomeFreqVariable implements IVariable {
    constructor(
        private config: IGameConfig,
        private convId: number,
        private outcomeId: number,
    ) {
    }

    public getValue(): number {
        return this.config.conversions[this.convId].outcomes[this.outcomeId].freq;
    }

    public setValue(value: number): number {
        return this.config.conversions[this.convId].outcomes[this.outcomeId].freq = value;
    }
}

class WinVariable implements IVariable {
    constructor(
        private config: IGameConfig,
        private convId: number,
        private outcomeId: number,
        private item: number,
    ) {
    }

    public getValue(): number {
        return this.config.conversions[this.convId].outcomes[this.outcomeId].wins[this.item].amount;
    }

    public setValue(value: number): number {
        return this.config.conversions[this.convId].outcomes[this.outcomeId].wins[this.item].amount = value;
    }
}

class VariableHandler {
    constructor(
        private v: IVariable,
    ) {
    }
}

export class Solver {
}
