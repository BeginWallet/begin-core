import { generateMnemonic } from "../src";

describe('Test', () => {
    it('get mnemonic', () => {
        console.log(generateMnemonic(160))
    });
});
