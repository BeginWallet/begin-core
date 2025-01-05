// import { Core } from "../src";
import * as Cardano from '@dcspark/cardano-multiplatform-lib-browser';
// import { NETWORK_ID } from "../src/config/config";
// import Utils from "../src/utils";
import BitcoinAccount from "../src/core/chain/bitcoin/account"
import * as bitcoinjs from "bitcoinjs-lib"
import * as ecc from 'tiny-secp256k1';
import * as bip32 from 'bip32';
import BitcoinTransaction from '../src/core/chain/bitcoin/transaction';
import ECPairFactory from 'ecpair';

describe('Create a Bitcoin Account', () => {
    it('Account Wallet Created', () => {
        const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');
        const bitcoin = new BitcoinAccount(Cardano, undefined, {lib: bitcoinjs, ecc, bip32}).createAccountWallet(mnemonic, 0, "Mainnet", "123456")

        expect(bitcoin.btcAddress).toEqual('3FmMk2aAJaUbgHsybpMv7d7AyaPphzwUMS');
        expect(bitcoin.ordinalsAddress).toBe('bc1p7vhqn6vqjk54ucrr0n3q2j9crwrqfhktq8gt09v4maeju6au0teq2lhl60');
    });

    it('Retore WIF and build tx', () => {
        const bitcoinTx = new BitcoinTransaction(
            Cardano, 
            undefined, 
            {lib: bitcoinjs, ecc, bip32, ecpair: { ECPairFactory: ECPairFactory } as any})
            .build(
            '3FmMk2aAJaUbgHsybpMv7d7AyaPphzwUMS',
            '40e2e3806ef2e06a20d8f9f8290f340ce82602e7a8232930207c63649ca138272af8eae0153a6fc0bdb1c31232fa3988352d1e15c865faa7494dad736fb7fc13f8dd6e6162172c9341261f0bf50a81ada396a6b40142a0025e23867746256e0427a99b912e11d0e77bd415489532f7d4',
            '123456',
            [{
                "txid": "00c2dea8f6fa68a9baee2aeac2bd84906da5e8f633fbfb53ebb03cbac3250e14",
                "vout": 1,
                "address": "3FmMk2aAJaUbgHsybpMv7d7AyaPphzwUMS",
                "script_pubkey": "a91456375bcdde24b6067132aca221a1633bb11b8a5287",
                "satoshis": "154643",
                "confirmations": 6882,
                "height": 868761,
                "runes": [],
                "inscriptions": []
            }],
            '10000',
            5000,
            [],
            'Mainnet',
            'BTC'
          );

        console.log({bitcoinTx})
    })

    // it('RootKey Created', () => {
    //     const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');

    //     const core = Core(Cardano).getInstance();
    //     const rootKey = core.Account.createRootKey(mnemonic)

    //     expect(rootKey.to_bech32())
    //         .toEqual('xprv1vzrzr76vqyqlavclduhawqvtae2pq8lk0424q7t8rzfjyhhp530zxv2fwq5a3pd4vdzqtu6s2zxdjhww8xg4qwcs7y5dqne5k7mz27p6rcaath83rl20nz0v9nwdaga9fkufjuucza8vmny8qpkzwstk5quneyk9');
    // });

    // it('Account Created', () => {
    //     const core = Core(Cardano).getInstance();
    //     const mnemonic = ["test", "walk", "nut", "penalty", "hip", "pave", "soap", "entry", "language", "right", "filter", "choice"].join(' ');
    //     const rootKey = core.Account.createRootKey(mnemonic)
    //     const password = 'testPwd123';
    //     const rootKeyBytes = rootKey.to_raw_bytes();
    //     const encryptedData = Utils.Encryption(Cardano)
    //         .encryptWithPassword(
    //             password, 
    //             rootKeyBytes
    //         )
    //     const accountData = core.Account
    //         .createAccount('Test Account', password, 0, encryptedData)
        
    //     expect(accountData.paymentPubKeyHash).toEqual('9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e');
    //     expect(accountData.stakePubKeyHash).toEqual('32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc');
    // });
});

// describe('Get current Account', () => {
//     it('Current Account returned by network', () => {
//         const networkInfo = {
//             id: Cardano.NetworkInfo.testnet().network_id(),
//             name: NETWORK_ID.testnet,
//         };

//         const accountData = {
//             index: 0,
//             name: 'Test Account',
//             avatar: '0.8168539622682212',
//             publicKey: '???',
//             paymentPubKeyHash: '9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e',
//             stakePubKeyHash: '32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc',
//             mainnet: {
//                 lovelace: BigInt(0),
//                 minAda: BigInt(0),
//                 assets: [],
//                 history: { confirmed: [], details: {} },
//                 recentSentAddrs: []
//             },
//             testnet: {
//                 lovelace: BigInt(0),
//                 minAda: BigInt(0),
//                 assets: [],
//                 history: { confirmed: [], details: {} },
//                 recentSentAddrs: []
//             },
//             encryptedRootKey: '0217484437fd4764bac8b8fea4215a799dd0fc04801dd6c34ff4b6976e64608f02cfaa1dee7df8f7ec05ee86553d5da4845534b5795ee08ae4c8d678579b2339ebf4876a971dfe46bcb22933e146cc1b9413fe9d381e3be83cc082aa0fa41b29fee7625541dc347124c780d2ecc10050f2f741e0b5a92f6afe25aa34f35c612dfc429acb2143ffcd867568914f85b02d3f0570cab7fa127b7c1281f6'
//         };

//         const core = Core(Cardano).getInstance();
//         const account = core.Account.getAccount(
//             accountData,
//             networkInfo
//         )

//         console.log(account)

//         expect(account.paymentAddr).toContain('addr_test');
//         expect(account.rewardAddr).toContain('stake_test');
//     });
// });

// describe('Exception Handling', () => {
//     it('Should not generate Key Pair with wrong password', () => {
//         const encryptedRootKey = '0217484437fd4764bac8b8fea4215a799dd0fc04801dd6c34ff4b6976e64608f02cfaa1dee7df8f7ec05ee86553d5da4845534b5795ee08ae4c8d678579b2339ebf4876a971dfe46bcb22933e146cc1b9413fe9d381e3be83cc082aa0fa41b29fee7625541dc347124c780d2ecc10050f2f741e0b5a92f6afe25aa34f35c612dfc429acb2143ffcd867568914f85b02d3f0570cab7fa127b7c1281f6';
//         const core = Core(Cardano).getInstance();

//         expect(() => {
//             core.Account.generateAccountKeyPair(
//                 'testPwd',
//                 0,
//                 encryptedRootKey
//             )
//         }
//         ).toThrowError('Wrong Password');
//     });
// });


