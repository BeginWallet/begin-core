import { Core } from "../src";
import * as Cardano from '@emurgo/cardano-serialization-lib-asmjs';
import { NETWORK_ID } from "../src/config/config";

describe('Transaction Verify', () => {
    it('Transaction is Invalid', () => {
        expect(() => {
            Core.Transaction(Cardano).verify("asdfadfasfa");
        }).toThrowError('Invalid Request')
    });
});