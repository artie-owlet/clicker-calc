import { IGameConfig } from '../game-config';

export const config: IGameConfig = {
    items: [
        'act',
        'gold',
        'energy',
    ],
    itemsMax: {},
    conversions: [
        { // poker
            inputs: {
                energy: { amount: 1 },
            },
            outcomes: [
                {
                    freq: 1,
                    wins: { gold: { amount: 100 }, act: { amount: 1 } },
                },
                {
                    freq: 2,
                    wins: { gold: { amount: 50 }, act: { amount: 1 } },
                },
                {
                    freq: 3,
                    wins: { gold: { amount: 33 }, act: { amount: 1 } },
                },
                {
                    freq: 5,
                    wins: { gold: { amount: 20 }, act: { amount: 1 } },
                },
                {
                    freq: 10,
                    wins: { gold: { amount: 10 }, act: { amount: 1 } },
                },
            ],
            period: '5s',
        },
        { // story
            inputs: {
                gold: { amount: 100 },
            },
            outcomes: [
                {
                    freq: 1,
                    wins: { energy: { amount: 1 } },
                },
                {
                    freq: 2,
                    wins: {},
                },
            ],
        },
    ],
    initAmounts: {
        'energy': 5000,
    },
};
