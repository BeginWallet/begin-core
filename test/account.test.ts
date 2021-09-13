import { Core } from "../src";
import * as Cardano from '@emurgo/cardano-serialization-lib-asmjs';
import { NETWORK_ID } from "../src/config/config";
import Utils from "../src/utils";

describe('Create a Cardano Account', () => {
    it('Account Wallet Created', () => {
        const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');

        const accountWallet = Core.Account(Cardano)
            .createAccountWallet('Test Account', '12345678', mnemonic, 0)

        expect(accountWallet.index).toEqual(0);
        expect(accountWallet.name).toEqual('Test Account');
        expect(accountWallet.avatar).not.toBeNull()
        expect(accountWallet.paymentPubKeyHash).toEqual('9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e');
        expect(accountWallet.stakePubKeyHash).toEqual('32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc');
        expect(accountWallet.mainnet).not.toBeNull()
        expect(accountWallet.testnet).not.toBeNull()
        expect(accountWallet.encryptedRootKey).not.toBeNull();
    });

    it('RootKey Created', () => {
        const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');

        const rootKey = Core.Account(Cardano).createRootKey(mnemonic)

        expect(rootKey.to_bech32())
            .toEqual('xprv1vzrzr76vqyqlavclduhawqvtae2pq8lk0424q7t8rzfjyhhp530zxv2fwq5a3pd4vdzqtu6s2zxdjhww8xg4qwcs7y5dqne5k7mz27p6rcaath83rl20nz0v9nwdaga9fkufjuucza8vmny8qpkzwstk5quneyk9');
    });

    it('Account Created', () => {
        const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');
        const rootKey = Core.Account(Cardano).createRootKey(mnemonic)
        const password = 'testPwd123';
        const rootKeyBytes = rootKey.as_bytes();
        const encryptedData = Utils.Encryption(Cardano)
            .encryptWithPassword(
                password, 
                rootKeyBytes
            )
        const accountData = Core.Account(Cardano)
            .createAccount('Test Account', password, 0, encryptedData)
        
        expect(accountData.paymentPubKeyHash).toEqual('9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e');
        expect(accountData.stakePubKeyHash).toEqual('32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc');
    });
});

describe('Get current Account', () => {
    it('Current Account returned by network', () => {
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const accountData = {
            index: 0,
            name: 'Test Account',
            avatar: '0.8168539622682212',
            paymentPubKeyHash: '9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e',
            stakePubKeyHash: '32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc',
            mainnet: {
                lovelace: BigInt(0),
                minAda: BigInt(0),
                assets: [],
                history: { confirmed: [], details: {} },
                recentSentAddrs: []
            },
            testnet: {
                lovelace: BigInt(0),
                minAda: BigInt(0),
                assets: [],
                history: { confirmed: [], details: {} },
                recentSentAddrs: []
            },
            encryptedRootKey: '0217484437fd4764bac8b8fea4215a799dd0fc04801dd6c34ff4b6976e64608f02cfaa1dee7df8f7ec05ee86553d5da4845534b5795ee08ae4c8d678579b2339ebf4876a971dfe46bcb22933e146cc1b9413fe9d381e3be83cc082aa0fa41b29fee7625541dc347124c780d2ecc10050f2f741e0b5a92f6afe25aa34f35c612dfc429acb2143ffcd867568914f85b02d3f0570cab7fa127b7c1281f6'
        };

        const account = Core.Account(Cardano).getAccount(
            accountData,
            networkInfo
        )

        console.log(account)

        expect(account.paymentAddr).toContain('addr_test');
        expect(account.rewardAddr).toContain('stake_test');
    });
});

describe('Exception Handling', () => {
    it('Should not generate Key Pair with wrong password', () => {
        const encryptedRootKey = '0217484437fd4764bac8b8fea4215a799dd0fc04801dd6c34ff4b6976e64608f02cfaa1dee7df8f7ec05ee86553d5da4845534b5795ee08ae4c8d678579b2339ebf4876a971dfe46bcb22933e146cc1b9413fe9d381e3be83cc082aa0fa41b29fee7625541dc347124c780d2ecc10050f2f741e0b5a92f6afe25aa34f35c612dfc429acb2143ffcd867568914f85b02d3f0570cab7fa127b7c1281f6';

        expect(() => {
            Core.Account(Cardano).generateAccountKeyPair(
                'testPwd',
                0,
                encryptedRootKey
            )
        }
        ).toThrowError('Wrong Password');
    });
});


