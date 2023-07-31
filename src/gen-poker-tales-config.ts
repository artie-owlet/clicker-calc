import {
    IConversion,
    IConversionWin,
    IGameConfig,
} from './game-config';

interface IPokerOutcome {
    freq: number;
    gold?: number;
    anchor?: number;
    magicball?: number;
    crown?: number;
}

interface IPokerRules {
    energyInput: number;
    period: string;
    outcomes: IPokerOutcome[];
}

function genereatePokerConfig(rules: IPokerRules, config: IGameConfig): void {
    const conv: IConversion = {
        inputs: {
            energy: { amount: rules.energyInput },
        },
        outcomes: [],
        period: rules.period,
    };
    rules.outcomes.forEach((po, id) => {
        const theft = `theft${id}`;
        config.itemsMax[theft] = 1;
        conv.outcomes.push({
            freq: po.freq,
            wins: {
                gold: { amount: po.gold ?? 0 },
                anchor: { amount: po.anchor ?? 0 },
                magicball: { amount: po.magicball ?? 0 },
                crown: { amount: po.crown ?? 0 },
                [theft]: { amount: 1 },
            },
        });
    });
    config.conversions.push(conv);
}

interface ITheftOutcome {
    freq: number;
    gold: number;
    energy: number;
}

interface ITheftRules {
    probs: number[];
    win: ITheftOutcome;
    loose: ITheftOutcome;
}

function generateTheftConfig(rules: ITheftRules, config: IGameConfig): void {
    // poker outcomes to theft pass
    rules.probs.forEach((prob, id) => {
        if (prob === 0) {
            return;
        }
        const theft = `theft${id}`;
        config.conversions.push({
            inputs: {
                [theft]: { amount: 1 },
            },
            outcomes: [
                {
                    freq: prob,
                    wins: {
                        theftPass: { amount: 1 },
                    },
                },
                {
                    freq: 100 - prob,
                    wins: {},
                },
            ],
        });
    });

    config.conversions.push({
        inputs: {
            theftPass: { amount: 1 },
        },
        outcomes: [
            {
                freq: rules.win.freq,
                wins: {
                    gold: { amount: rules.win.gold },
                    energy: { amount: rules.win.energy },
                },
            },
            {
                freq: rules.loose.freq,
                wins: {
                    gold: { amount: rules.loose.gold },
                    energy: { amount: rules.loose.energy },
                },
            },
        ],
    });
}

interface IStorySubLevel {
    goldInput: number;
    wins: Record<string, number>;
}

interface IStoryRules {
    first: IStorySubLevel[];
    multi: IStorySubLevel[];
    levelsNum: number;
}

function generateStoryLevelConfig(levelId: number, level: IStorySubLevel[], config: IGameConfig): void {
    let subLevelId = levelId * level.length;
    level.forEach((sl) => {
        const current = `level${subLevelId}`;
        const next = `level${subLevelId + 1}`;
        const wins: Record<string, IConversionWin> = {};
        for (const key in sl.wins) {
            wins[key] = { amount: sl.wins[key] };
        }
        wins[next] = { amount: 1 };
        config.conversions.push({
            inputs: {
                gold: { amount: sl.goldInput },
                [current]: { amount: 1 },
            },
            outcomes: [
                {
                    freq: 1,
                    wins,
                },
            ],
        });
        ++subLevelId;
    });
}

function generateStoryConfig({ first, multi, levelsNum }: IStoryRules, config: IGameConfig): void {
    for (let levelId = 0; levelId < levelsNum; ++levelId) {
        const level: IStorySubLevel[] = first.map((sl, id) => {
            const subLevel: IStorySubLevel = {
                goldInput: Math.floor(sl.goldInput * Math.pow(multi[id].goldInput, levelId)),
                wins: {},
            };
            for (const key in sl.wins) {
                subLevel.wins[key] = Math.floor(sl.wins[key] * Math.pow(multi[id].wins[key], levelId));
            }
            return subLevel;
        });
        generateStoryLevelConfig(levelId, level, config);
    }
}

export interface IPokerTalesRules {
    initEnergy: number;
    refillEnergyPeriod: string;
    poker: IPokerRules;
    theft: ITheftRules;
    story: IStoryRules;
}

export function generatePokerTalesConfig(rules: IPokerTalesRules): IGameConfig {
    const config: IGameConfig = {
        items: [
            'energy',
            'gold',
            'anchor',
            'magicball',
            'crown',
            'theftPass',
            'egg',
            'umbrella',
            'level0',
        ],
        itemsMax: {
            umbrella: 3,
        },
        conversions: [],
        initAmounts: {
            energy: rules.initEnergy,
        },
    };

    // free energy
    config.conversions.push({
        inputs: {},
        outcomes: [
            {
                freq: 1,
                wins: {
                    energy: {
                        amount: 50,
                        totalLimit: 50,
                    },
                },
            },
        ],
        period: rules.refillEnergyPeriod,
    });

    genereatePokerConfig(rules.poker, config);

    generateTheftConfig(rules.theft, config);

    generateStoryConfig(rules.story, config);

    // pets

    return config;
}
