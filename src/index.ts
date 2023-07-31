/* eslint-disable no-console */
import { inspect } from 'util';
// import { Game } from './game';
import { generatePokerTalesConfig } from './gen-poker-tales-config';

const config = generatePokerTalesConfig({
    initEnergy: 500,
    refillEnergyPeriod: '1h',
    poker: {
        energyInput: 1,
        period: '5s',
        outcomes: [
            { freq: 1, gold: 100 },
            { freq: 2, gold: 50 },
            { freq: 3, gold: 33 },
            { freq: 5, gold: 20 },
            { freq: 10, gold: 10 },
            { freq: 20 },
        ],
    },
    theft: {
        probs: [50, 25, 10, 5, 2, 1],
        win: {
            freq: 1,
            gold: 100,
            energy: 10,
        },
        loose: {
            freq: 1,
            gold: 10,
            energy: 0,
        },
    },
    story: {
        first: [
            {
                goldInput: 1000,
                wins: { energy: 10 },
            },
            {
                goldInput: 1200,
                wins: { energy: 15 },
            },
            {
                goldInput: 1500,
                wins: { energy: 20 },
            },
        ],
        multi: [
            {
                goldInput: 2,
                wins: { energy: 1.5 },
            },
            {
                goldInput: 2,
                wins: { energy: 1.5 },
            },
            {
                goldInput: 2,
                wins: { energy: 1.5 },
            },
        ],
        levelsNum: 5,
    },
});

console.log(inspect(config, { depth: Infinity }));

// const game = new Game(config);
// for (let i = 0; i < 10; ++i) {
//     game.simulate(1000000);
//     console.log(game.result());
//     game.reset();
// }
