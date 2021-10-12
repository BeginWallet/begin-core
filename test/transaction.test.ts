import { Core } from "../src";
import * as Cardano from '@emurgo/cardano-serialization-lib-asmjs';
import { MockLovelace } from './test_data/mock_data_ada';
import { NETWORK_ID } from "../src/config/config";
import { providerStub } from "./test_data/provider_stub";
import { KeyManagement } from "@cardano-sdk/wallet";
import { NetworkId } from "@cardano-sdk/core/dist/Cardano/NetworkId";
import { CardanoSerializationLib } from "@cardano-sdk/core";
import { ProtocolParametes } from "../src/core/transaction";
import { MockMultiAsset } from './test_data/mock_data_multiassets';

const core = Core(Cardano).getInstance();

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

        const utxos = MockLovelace.getMockInputsUtxos();
        console.log(utxos.size);

        const outputs = MockLovelace.getMockOutputs();
        console.log(outputs.size)

        const protocolParameters = {
            ...await providerStub().currentWalletProtocolParameters(),
            slot: 3600
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParametes;

        //Replace it for asm pure js
        const csl = Cardano as CardanoSerializationLib;
        const keyManager = KeyManagement.createInMemoryKeyManager({
            csl,
            mnemonicWords: KeyManagement.util.generateMnemonicWords(),
            networkId: NetworkId.testnet,
            password: '123'
          });
          
        const transaction = await core.Transaction.build(
            account,
            keyManager,
            utxos,
            outputs,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(260000);
        expect(transaction.body().fee().to_str()).toContain("17");
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

        const utxos = MockLovelace.getMockInputsUtxosSmall();
        console.log(utxos.size);

        const outputs = MockLovelace.getMockOutputsSmall();
        console.log(outputs.size)

        const protocolParameters = {
            ...await providerStub().currentWalletProtocolParameters(),
            slot: 3600
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParametes;

        //Replace it for asm pure js
        const csl = Cardano as CardanoSerializationLib;
        const keyManager = KeyManagement.createInMemoryKeyManager({
            csl,
            mnemonicWords: KeyManagement.util.generateMnemonicWords(),
            networkId: NetworkId.testnet,
            password: '123'
          });
          
        const transaction = await core.Transaction.build(
            account,
            keyManager,
            utxos,
            outputs,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(260000);
        expect(transaction.body().fee().to_str()).toContain("17");
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

        const utxos = MockLovelace.getMockInputsUtxosMin();
        console.log(utxos.size);

        const outputs = MockLovelace.getMockOutputsMin();
        console.log(outputs.size)

        const protocolParameters = {
            ...await providerStub().currentWalletProtocolParameters(),
            slot: 3600
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParametes;

        //Replace it for asm pure js
        const csl = Cardano as CardanoSerializationLib;
        const keyManager = KeyManagement.createInMemoryKeyManager({
            csl,
            mnemonicWords: KeyManagement.util.generateMnemonicWords(),
            networkId: NetworkId.testnet,
            password: '123'
          });
          
        const transaction = await core.Transaction.build(
            account,
            keyManager,
            utxos,
            outputs,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(260000);
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

        const utxos = MockMultiAsset.getMockInputsUtxos();
        console.log(utxos.size);

        const outputs = MockMultiAsset.getMockOutputs();
        console.log(outputs.size)

        const protocolParameters = {
            ...await providerStub().currentWalletProtocolParameters(),
            slot: 3600
            // minFeeCoefficient: 44,
            // minFeeConstant: 15_5381,
            // coinsPerUtxoWord: 34_482,
            // maxTxSize: 16384,
            // maxValueSize: 5000
          } as ProtocolParametes;

        //Replace it for asm pure js
        const csl = Cardano as CardanoSerializationLib;
        const keyManager = KeyManagement.createInMemoryKeyManager({
            csl,
            mnemonicWords: KeyManagement.util.generateMnemonicWords(),
            networkId: NetworkId.testnet,
            password: '123'
          });
          
        const transaction = await core.Transaction.build(
            account,
            keyManager,
            utxos,
            outputs,
            protocolParameters
        );

        console.log(Buffer.from(transaction.body().to_bytes()).toString('hex'));
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()).toBe(260000);
        expect(transaction.body().fee().to_str()).toBe("178437");
    });

    it('Error UTxO Balance Insufficient', async () => {
        expect.assertions(1);
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

        const utxos = MockMultiAsset.getMockInputsUtxos();
        console.log(utxos.size);

        const outputs = MockMultiAsset.getMockOutputsCustom('2', '20000');
        console.log(outputs.size);

        const protocolParameters = {
            ...await providerStub().currentWalletProtocolParameters(),
            slot: 3600
        } as ProtocolParametes;

        //Replace it for asm pure js
        const csl = Cardano as CardanoSerializationLib;
        const keyManager = KeyManagement.createInMemoryKeyManager({
            csl,
            mnemonicWords: KeyManagement.util.generateMnemonicWords(),
            networkId: NetworkId.testnet,
            password: '123'
        });

        try {
            await core.Transaction.build(
                account,
                keyManager,
                utxos,
                outputs,
                protocolParameters
            );

        } catch (e) {
            if (e){
                const error = (e as String).toString();
                expect(error).toEqual('InputSelectionError: UTxO Balance Insufficient');
            }
        }
    })
});