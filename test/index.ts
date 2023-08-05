import { expect } from '@artie-owlet/chifir';

import { Game, IGameConfig } from '../src/index';

const config: IGameConfig = {
    items: [
        'res1',
        'res2',
        'res3',
        'res4',
    ],
    itemsMax: {
        res5: 3,
    },
    conversions: [
        {
            inputs: {
                res1: { amount: 1 },
            },
            outcomes: [
                {
                    freq: 1,
                    wins: {
                        res2: { amount: 1 },
                        res3: { amount: 1, totalLimit: 5 },
                    },
                },
            ],
            period: '1s',
        },
        {
            inputs: {
                res4: { amount: 1 },
            },
            outcomes: [
                {
                    freq: 1,
                    wins: {
                        res5: { amount: 1 },
                    },
                },
            ],
        },
    ],
    initAmounts: {
        res1: 10,
        res4: 10,
    },
};

describe('Game', () => {
    it('should simulate game', () => {
        const game = new Game(config);
        game.simulate(100);
        expect(game.result().get('res1')).eq(0);
        expect(game.result().get('res2')).eq(10);
        expect(game.result().get('res3')).eq(5);
        expect(game.result().get('res4')).eq(0);
        expect(game.result().get('res5')).eq(3);
        game.reset();
        expect(game.result().get('res1')).eq(10);
        expect(game.result().get('res2')).eq(0);
        expect(game.result().get('res3')).eq(0);
        expect(game.result().get('res4')).eq(10);
        expect(game.result().get('res5')).eq(0);
    });
});
