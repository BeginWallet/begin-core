import Utils from "../src/utils";
import * as CardanoLib from '@dcspark/cardano-multiplatform-lib-browser';

describe('Test Encryption', () => {
    it('Encrypt and Decrypt of root key', () => {
        const rootKey = CardanoLib.Bip32PrivateKey.generate_ed25519_bip32();
        const password = 'testPwd123';
        const rootKeyBytes = rootKey.to_raw_key().as_bytes();
        const encryptedKey = Utils.Encryption(CardanoLib).encryptWithPassword(password, rootKeyBytes);
        expect(Buffer.from(rootKeyBytes).toString('hex')).not.toBe(
          encryptedKey
        );
        const decryptedKey = Utils.Encryption(CardanoLib).decryptWithPassword(password, encryptedKey);
        expect(Buffer.from(rootKeyBytes).toString('hex')).toBe(decryptedKey);
    });
});