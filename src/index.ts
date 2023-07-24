import { items, rules } from './test-data/poker1';
import { simulate } from './calc';

simulate(100000, items, rules);
console.log(items);
