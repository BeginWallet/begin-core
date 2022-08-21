import { Core } from "../src";
import * as CardanoBrowser from '@emurgo/cardano-serialization-lib-browser';
// import * as CardanoBrowser from '@dcspark/cardano-multiplatform-lib-browser';
// import type * as CardanoLibAll from '../temp_modules/@dcspark/cardano-multiplatform-lib-nodejs';
// import type * as CardanoLibAll from '@dcspark/cardano-multiplatform-lib-nodejs';
import type * as CardanoLibAll from '@emurgo/cardano-serialization-lib-nodejs';
import type * as MessageLibAll from '@emurgo/cardano-message-signing-nodejs';
import { MockLovelace } from './test_data/mock_data_ada';
import { NETWORK_ID } from "../src/config/config";
import { ProtocolParameters } from "../src/core/transaction";
import { MockMultiAsset } from './test_data/mock_data_multiassets';
import { CoreInstance } from "../src/core";

const CardanoLib = async () =>
    // await import('../temp_modules/@dcspark/cardano-multiplatform-lib-nodejs')
    // await import('@dcspark/cardano-multiplatform-lib-nodejs')
    await import('@emurgo/cardano-serialization-lib-nodejs');


type CardanoLibType = typeof CardanoLibAll;

const MessageLib = async () =>
  await import('@emurgo/cardano-message-signing-nodejs');

type MessageLibType = typeof MessageLibAll;

let Cardano: CardanoLibType;
let Message: MessageLibType;
let core: CoreInstance; // = Core(Cardano).getInstance();

beforeEach(async () => {
    Cardano = await CardanoLib();
    Message = await MessageLib();
    core = Core(Cardano, Message).getInstance();
})

const networkInfo = {
    id: CardanoBrowser.NetworkInfo.testnet().network_id(),
    name: NETWORK_ID.testnet,
};

const accountData = {
    index: 0,
    name: 'Test Account',
    avatar: '0.8168539622682212',
    publicKey: '???',
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

describe('Transaction Verify', () => {
    it('Transaction is Invalid', () => {
        expect(() => {
            core.Transaction.verify("asdfadfasfa");
        }).toThrowError('Invalid Request')
    });

    it('ADA Only - Transaction is built', async () => {
        //TODO: Review need to use account data. with new cardano-js-sdk
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const core = Core(Cardano).getInstance();
        const account = core.Account.getAccount(
            accountData,
            networkInfo
        )

        const utxos = await MockLovelace.getMockInputsUtxos();
        console.log(utxos.length);

        const outputs = await MockLovelace.getMockOutputs();
        console.log(outputs.len())

        const protocolParameters = {
            minFeeA: Cardano.BigNum.from_str('44'),
            minFeeB: Cardano.BigNum.from_str('155381'),
            minUtxo: Cardano.BigNum.from_str('4310'),
            poolDeposit: Cardano.BigNum.from_str('500000000'),
            keyDeposit: Cardano.BigNum.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigNum.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigNum.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            // ...await providerStub().currentWalletProtocolParameters(),
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParameters;

        //Replace it for asm pure js
        // const csl = Cardano as CardanoSerializationLib;
        // const keyManager = KeyManagement.createInMemoryKeyManager({
        //     csl,
        //     mnemonicWords: KeyManagement.util.generateMnemonicWords(),
        //     networkId: NetworkId.testnet,
        //     password: '123'
        //   });

        console.log(protocolParameters.coinsPerUtxoWord.to_str())
          
        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        //Sign Transaction and generate txHash
        const witnessSet = core.Transaction.sign(
            Buffer.from(transaction.to_bytes()).toString('hex'),
            [
                accountData.paymentPubKeyHash
                // accountData.paymentPubKeyHash
            ],
            '12345678',
            0,
            accountData.encryptedRootKey,
            false
          );
          const txSigned = Cardano.Transaction.new(
            transaction.body(),
            witnessSet,
            transaction.auxiliary_data()
          );

          console.log(Buffer.from(txSigned.to_bytes()).toString('hex'));
          console.log("Buffer Array")
          console.log(Buffer.from(Buffer.from(txSigned.to_bytes()).toString('hex'), 'hex').toString('hex'))
        
        //   const txHash = await submitTx(
        //     Buffer.from(txSigned.to_bytes(), 'hex').toString('hex')
        //   );
        core.Transaction.verify(Buffer.from(txSigned.to_bytes()).toString('hex'))
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(25200);
        expect(transaction.body().fee().to_str()).toContain("16");
    });

    it('ADA Only Small Balance - Transaction is built', async () => {
        //TODO: Review need to use account data. with new cardano-js-sdk
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const core = Core(Cardano).getInstance();
        const account = core.Account.getAccount(
            accountData,
            networkInfo
        )

        const utxos = await MockLovelace.getMockInputsUtxosSmall();
        console.log(utxos.length);

        const outputs = await MockLovelace.getMockOutputsSmall();
        console.log(outputs.len())

        const protocolParameters = {
            minFeeA: Cardano.BigNum.from_str('44'),
            minFeeB: Cardano.BigNum.from_str('155381'),
            minUtxo: Cardano.BigNum.from_str('4310'),
            poolDeposit: Cardano.BigNum.from_str('500000000'),
            keyDeposit: Cardano.BigNum.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigNum.from_str('4310')
            // ...await providerStub().currentWalletProtocolParameters(),
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParameters;

        //Replace it for asm pure js
        // const csl = Cardano as CardanoSerializationLib;
        // const keyManager = KeyManagement.createInMemoryKeyManager({
        //     csl,
        //     mnemonicWords: KeyManagement.util.generateMnemonicWords(),
        //     networkId: NetworkId.testnet,
        //     password: '123'
        //   });
        
        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(25200);
        expect(transaction.body().fee().to_str()).toContain("16");
    });

    it('ADA Only 1 ADA - Transaction is built', async () => {
        //TODO: Review need to use account data. with new cardano-js-sdk
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const core = Core(Cardano).getInstance();
        const account = core.Account.getAccount(
            accountData,
            networkInfo
        )

        const utxos = await MockLovelace.getMockInputsUtxosMin();
        console.log(utxos.length);

        const outputs = await MockLovelace.getMockOutputsMin();
        console.log(outputs.len())

        const protocolParameters = {
            minFeeA: Cardano.BigNum.from_str('44'),
            minFeeB: Cardano.BigNum.from_str('155381'),
            minUtxo: Cardano.BigNum.from_str('4310'),
            poolDeposit: Cardano.BigNum.from_str('500000000'),
            keyDeposit: Cardano.BigNum.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigNum.from_str('4310')
            // ...await providerStub().currentWalletProtocolParameters(),
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParameters;

        //Replace it for asm pure js
        // const csl = Cardano as CardanoSerializationLib;
        // const keyManager = KeyManagement.createInMemoryKeyManager({
        //     csl,
        //     mnemonicWords: KeyManagement.util.generateMnemonicWords(),
        //     networkId: NetworkId.testnet,
        //     password: '123'
        //   });
          
        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));

        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(25200);
        expect(transaction.body().fee().to_str()).toContain("16");
    });

    it('Multiasset - Transaction is built', async () => {
        //TODO: Review need to use account data. with new cardano-js-sdk
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const core = Core(Cardano).getInstance();
        const account = core.Account.getAccount(
            accountData,
            networkInfo
        )

        const utxos = await MockMultiAsset.getMockInputsUtxos();
        console.log(utxos.length);

        const outputs = await MockMultiAsset.getMockOutputs();
        console.log(outputs.len())

        const protocolParameters = {
            minFeeA: Cardano.BigNum.from_str('44'),
            minFeeB: Cardano.BigNum.from_str('155381'),
            minUtxo: Cardano.BigNum.from_str('4310'),
            poolDeposit: Cardano.BigNum.from_str('500000000'),
            keyDeposit: Cardano.BigNum.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigNum.from_str('4310')
            // ...await providerStub().currentWalletProtocolParameters(),
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParameters;

        //Replace it for asm pure js
        // const csl = Cardano as CardanoSerializationLib;
        // const keyManager = KeyManagement.createInMemoryKeyManager({
        //     csl,
        //     mnemonicWords: KeyManagement.util.generateMnemonicWords(),
        //     networkId: NetworkId.testnet,
        //     password: '123'
        //   });
          
        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(25200);
        expect(transaction.body().fee().to_str()).toBe("168229");
    });

    it('Error UTxO Balance Insufficient', async () => {
        expect.assertions(0);
        //TODO: Review need to use account data. with new cardano-js-sdk
        const networkInfo = {
            id: Cardano.NetworkInfo.testnet().network_id(),
            name: NETWORK_ID.testnet,
        };

        const core = Core(Cardano).getInstance();
        const account = core.Account.getAccount(
            accountData,
            networkInfo
        );
        const utxos = await MockMultiAsset.getMockInputsUtxos();
        console.log(utxos.length);

        const outputs = await MockMultiAsset.getMockOutputsCustom('2', '3000000');
        console.log(outputs.len());

        const protocolParameters = {
            minFeeA: Cardano.BigNum.from_str('44'),
            minFeeB: Cardano.BigNum.from_str('155381'),
            minUtxo: Cardano.BigNum.from_str('4310'),
            poolDeposit: Cardano.BigNum.from_str('500000000'),
            keyDeposit: Cardano.BigNum.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigNum.from_str('4310')
            // ...await providerStub().currentWalletProtocolParameters(),
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParameters;

        //Replace it for asm pure js
        // const csl = Cardano as CardanoSerializationLib;
        // const keyManager = KeyManagement.createInMemoryKeyManager({
        //     csl,
        //     mnemonicWords: KeyManagement.util.generateMnemonicWords(),
        //     networkId: NetworkId.testnet,
        //     password: '123'
        // });

        try {
            await core.Transaction.build(
                account,
                utxos as any,
                outputs as any,
                protocolParameters
            );

        } catch (e) {
            console.log(e)
            if (e){
                const error = (e as String).toString();
                expect(error).toEqual('InputSelectionError: UTxO Balance Insufficient');
            }
        }
    })

    it('Should sign a message', async () => {
        const paymentBytesHex = '009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc';
        const payload = 'This is my secret msg.'
        const payloadHex = Buffer.from(payload).toString('hex')
        console.log('payloadHex', payloadHex)
        console.log('payloadHex reverse', Buffer.from(payloadHex, 'hex').toString())
        
        const result = await core.Transaction.signData(
            paymentBytesHex,
            payloadHex,
            '12345678',
            0,
            accountData.encryptedRootKey,
            networkInfo
          );

        console.log('Sign data',result);

        expect(result.signature).toEqual('845846a2012767616464726573735839009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dca166686173686564f45654686973206973206d7920736563726574206d73672e584080b60cf63fa4f2d5828241cf87547fd825bb29a69e3da0f0cbf86e7eb9097d3870bb6dd5cc4e150f7cfeba249565eaad52dcddfbae3b6d0057132df8eb50ea0f')
    })

    it('Should build delegation transaction for pool', async () => {
        const poolId = 'pool19f6guwy97mmnxg9dz65rxyj8hq07qxud886hamyu4fgfz7dj9gl';
        // this.Cardano.Ed25519KeyHash.from_bytes(Buffer.from(poolId, 'hex'));
        // const test = Buffer.from(poolId.toString()).toString('hex')
        // const poolIdHex = Cardano.EnterpriseAddress.from_address(Buffer.from(test, 'hex'));
        // const base = Cardano.BaseAddress.from_address(address)?.to_address();
        // const poolIdHex = Buffer.from(core.Address.getAddress(poolId), 'hex').toString('hex') //Cardano.BaseAddress.from_address(poolId).to_bytes()//core.Address.getAddress(poolId); //
        
        console.log('poolId', poolId)
        // console.log('address', address)
        // console.log('base', base)
        // console.log('poolIdHex', poolIdHex)
        
        // const result = await core.Transaction.delegation(poolId);
        
        // console.log(result.to_bech32('pool'));
        // console.log(Buffer.from(result.to_bytes()).toString('hex'));

    })
});