import { Core } from "../src";
import * as CardanoBrowser from '@dcspark/cardano-multiplatform-lib-browser';
// import type * as CardanoLibAll from '../temp_modules/@dcspark/cardano-multiplatform-lib-nodejs';
import type * as CardanoLibAll from '@dcspark/cardano-multiplatform-lib-nodejs';
import type * as MessageLibAll from '@emurgo/cardano-message-signing-nodejs';
import { MockLovelace } from './test_data/mock_data_ada';
import { NETWORK_ID } from "../src/config/config";
import { ProtocolParameters } from "../src/core/transaction";
import { MockMultiAsset } from './test_data/mock_data_multiassets';
import { CoreInstance } from "../src/core";

const CardanoLib = async () =>
    // await import('../temp_modules/@dcspark/cardano-multiplatform-lib-nodejs')
    await import('@dcspark/cardano-multiplatform-lib-nodejs');


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
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigInteger.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
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

        console.log(transaction.body().to_cbor_hex());
        //Sign Transaction and generate txHash
        const witnessSet = core.Transaction.sign(
            transaction.to_cbor_hex(),
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
            true,
            transaction.auxiliary_data()
          );

          console.log(txSigned.to_cbor_hex());
          console.log("Buffer Array")
          console.log(Buffer.from(txSigned.to_cbor_hex(), 'hex').toString('hex'))
        
        //   const txHash = await submitTx(
        //     Buffer.from(txSigned.to_bytes(), 'hex').toString('hex')
        //   );
        core.Transaction.verify(txSigned.to_cbor_hex())
        expect(txSigned.is_valid()).toBe(true)
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()?.toString()).toBe("25200");
        expect(transaction.body().fee().toString()).toContain("174257");
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
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
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

        console.log(transaction.body().to_cbor_hex());
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()?.toString()).toBe("25200");
        expect(transaction.body().fee().toString()).toContain("172673");
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
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigInteger.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
          } as ProtocolParameters;

        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(transaction.body().to_cbor_hex());

        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()?.toString()).toBe("25200");
        expect(transaction.body().fee().toString()).toContain("16");
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
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigInteger.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
          } as ProtocolParameters;
          
        const transaction = await core.Transaction.build(
            account,
            utxos as any,
            outputs as any,
            protocolParameters
        );

        console.log(transaction.body().to_cbor_hex());
        expect(transaction.body()).toBeInstanceOf(Cardano.TransactionBody);
        expect(transaction.body().ttl()?.toString()).toBe("25200");
        expect(transaction.body().fee().toString()).toBe("175489");
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
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigInteger.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
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

        const protocolParameters = {
            minFeeA: Cardano.BigInteger.from_str('44'),
            minFeeB: Cardano.BigInteger.from_str('155381'),
            minUtxo: Cardano.BigInteger.from_str('4310'),
            poolDeposit: Cardano.BigInteger.from_str('500000000'),
            keyDeposit: Cardano.BigInteger.from_str('2000000'),
            maxValSize: 1000,
            maxTxSize: 16384,
            slot: 3600,
            coinsPerUtxoWord: Cardano.BigInteger.from_str('4310'),
            coinsPerUtxoSize: Cardano.BigInteger.from_str('4310'),
            collateralPercentage: 150,
            maxCollateralInputs: 3,
            priceMem: 0.05770000070333481,
            priceStep: 0.00007210000330815092,
            refScriptCostPerBytes: Cardano.BigInteger.from_str('4310'),
          } as ProtocolParameters;
        
        const result = await core.Transaction.delegation(
            account,
            poolId,
            { active: false},
            utxos,
            protocolParameters
        );
        
        // console.log(result.to_bech32('pool'));
        console.log(result.to_cbor_hex());

    })

    it('Should sign and check this transaction', async () => {
        const txHex = '84a3008182582096f90c12ef1a193d8d0ca93fe2015da68f8233acd9429047f9c9f08ee73930f2000182825839008473d8e86b22c202d8d3df24debcb6d1746dd389b5eba91e38ec739e0bee88503f60afc7730731db3bdc45a2a3ecba4469f0645dc2373ebd1a00e4e1c0825839005f7f150f55cc0e3ce6d4e2d7f6b6a5f650f2c8a7cbc1d45540f02377258566d39cabb7ec800d2789d2fe116a4d28c4911b3091bc545975b31a37f1a239021a00029075a0f5f6'

        const tx = Cardano.Transaction.from_cbor_bytes(Buffer.from(txHex, 'hex'))

        console.log(tx.to_json())

        const witnessSet = core.Transaction.sign(
            txHex,
            [
                // '5f7f150f55cc0e3ce6d4e2d7f6b6a5f650f2c8a7cbc1d45540f02377'
                '9493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e'
            ],
            '12345678',
            0,
            accountData.encryptedRootKey,
            false
          );
          const txSigned = Cardano.Transaction.new(
            tx.body(),
            witnessSet,
            true,
            tx.auxiliary_data()
          );

          expect(txSigned.is_valid()).toBeTruthy();
    })

    it('Should generate datum transaction', async () => {
        const field1 = "9a9693a9a37912a5097918f97918d15240c92ab729a0b7c4aa144d77"
        const field2 = "53554e444145"
        const field3 = "08"

        console.log('field1 reverse', Buffer.from(field1, 'hex').toString('utf8'));
        console.log('field2 reverse', Buffer.from(field2, 'hex').toString('utf8'));
        console.log('field3 reverse', Buffer.from(field3, 'hex').toString('hex'));
    })

    it('Test tx hash', async () => {
        const txHashId = '5a21d89c8c4bfaeae8c8b53491a0483b86a609c071ea05fcbdef3c25a251eccd';
        const tx = Cardano.Transaction.from_cbor_hex('84aa0084825820558df0943b4c5cc403b3227fe439bae85c640bbb3d33f7c8d3e795b00522e9ff0d825820558df0943b4c5cc403b3227fe439bae85c640bbb3d33f7c8d3e795b00522e9ff108258206b794592f85b2eaeee81c94d4d8a368546f599d911d538b006bd2857f01f9e5103825820bc373a78fa673b40e5eb6583c3e8984e6b17e6892950e0486e4404717360c2ec020183825839011b80793562f41a30a05faaa42017adc25e02ca743b34e8d8ecc7a24bd1e5485635afac369331adabc8c9dc84939319300239661aa016c0621a004c4b4082583901eb42ad9509ed533eadffcb42056592c7f5579264dd4aeeb9774b2f21edf348c641ab34b44fde55afd78bd37b1739ceb3209f19b30133198e821a0e7c8f06a1581c43b07d4037f0d75ee10f9863097463fc02ff3c0b8b705ae61d9c75bfa14b4d796e746820546f6b656e1a0230bb78825839011b80793562f41a30a05faaa42017adc25e02ca743b34e8d8ecc7a24bd1e5485635afac369331adabc8c9dc84939319300239661aa016c062821a005bf4a4a1581c43b07d4037f0d75ee10f9863097463fc02ff3c0b8b705ae61d9c75bfa14b4d796e746820546f6b656e1a004c4b40021a000325b0031a07f57eba05a1581de1edf348c641ab34b44fde55afd78bd37b1739ceb3209f19b30133198e1a0002e9430b5820edcd35f44bd058aa54f7e0ed5732c90d6cc11deab0390bc3deca4705db14ffc00d81825820bc373a78fa673b40e5eb6583c3e8984e6b17e6892950e0486e4404717360c2ec0210825839011b80793562f41a30a05faaa42017adc25e02ca743b34e8d8ecc7a24bd1e5485635afac369331adabc8c9dc84939319300239661aa016c0621a0e2d5a83111a004c4b40128182582033954e04741c1406085d5e104a9e067e0eb5dfc37bb19ad66681e5222c4eda7b00a200818258200f49e12fecf8d55e5ee652dedf9f92bc01ea4ae7f5832553881d56cdabdadf495840592f54158af308e2e432237dfbd08cbbe534cb2e5d5a08c56ab993fb4e27a537c675ffef7b2273ce24b5cf0a5b3784f3d427cbfac21a7f1989f58de0ff06b6010581840002d87980821a000121721a01d22ba9f5f6');

        const txHashIdFromHex = Cardano.hash_transaction(tx.body()).to_hex();
        console.log({txHashIdFromHex});

        expect(txHashId).toEqual(txHashIdFromHex);
    })


    it('Test tx hash withdraw', async () => {
        const txHashId = '7e78a8d34ec5e792d75ae852ba920cbe82f5f941f9c3d521000fbc8cfb9bba9c';
        const tx = Cardano.Transaction.from_cbor_hex('84ac0082825820fbe598678fe4ac8223116d0c5cdcb2b064a29b7b0d89fbc5b75875def580abb803825820fe555315b46d67981d3bf4da0f0e809cea99a5c9bd52579e2ae29e960ab4feea010182a300583911c666bc4d42515ec470cc69a62fe510e02961ed5165e89235cfd9b6b74faef712a5c7fd4397628537e8567850138992b2fcbc44e4acf9a48b01821a002bccbca2581c8525356c4877ff88c04caec2f4e1e1f283598de40e920fdadb3da996a358208c8a6a6def7a7f75520eb6f3cc9d72c7e22d45aab21e9baf2c1675337ea92acf015820a420a7454847445ae317f0f31b8cb54563ffba8d4a408109b3d90048286dc523015820b200575e884305b5d904317e78732f9c6f0b87b931bdeab2fc2a685ed1aa97f901581c92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779ca1454d795553441a004c4b40028201d81858fcd8798b1b00000191c48fe79858208c8a6a6def7a7f75520eb6f3cc9d72c7e22d45aab21e9baf2c1675337ea92acf581c92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779c454d795553445820a420a7454847445ae317f0f31b8cb54563ffba8d4a408109b3d90048286dc523581c93c08a9c9e32626154470889160260029d00fc54bcc4475825d20e2b405820b200575e884305b5d904317e78732f9c6f0b87b931bdeab2fc2a685ed1aa97f9d8798218c718c8581cff374dde85ec73197371bfef9a1382e00f2ab379087957d2789a74ae58200e5751c026e543b2e8ab2eb06099daa1d1e5df47778f7787faab45cdf12fe3a882583901ea6882fecbc1a4fdbb95373b1cac97d889e20ea20add9b79fd40b7be4faef712a5c7fd4397628537e8567850138992b2fcbc44e4acf9a48b821a1ecf7202a3581c35e50636facf48c9544e6be41b21221f63e176d37980898c43705efea14b54564b696c6c733035303501581c43b07d4037f0d75ee10f9863097463fc02ff3c0b8b705ae61d9c75bfa14b4d796e746820546f6b656e1a028f45af581c92776616f1f32c65a173392e4410a3d8c39dcf6ef768c73af164779ca1454d795553441a063d9f83021a0003cb43031a07fcd5f705a1581df12a646ae6eefe42a24fff4b710cb2ba9149bff794a2505729876cf19c00075820cc29dc8eb60049ee2151628551ce1109e294aae26b2e68853977a2981f722f9409a1581c8525356c4877ff88c04caec2f4e1e1f283598de40e920fdadb3da996a358208c8a6a6def7a7f75520eb6f3cc9d72c7e22d45aab21e9baf2c1675337ea92acf015820a420a7454847445ae317f0f31b8cb54563ffba8d4a408109b3d90048286dc523015820b200575e884305b5d904317e78732f9c6f0b87b931bdeab2fc2a685ed1aa97f9010b5820158a55f85ca6701ce023bb00ce3b0c2f9ed7c593d3cad7eb70a4e81dbaf069260d81825820fbe598678fe4ac8223116d0c5cdcb2b064a29b7b0d89fbc5b75875def580abb8031082583901ea6882fecbc1a4fdbb95373b1cac97d889e20ea20add9b79fd40b7be4faef712a5c7fd4397628537e8567850138992b2fcbc44e4acf9a48b821a1e943a41a2581c35e50636facf48c9544e6be41b21221f63e176d37980898c43705efea14b54564b696c6c733035303501581c43b07d4037f0d75ee10f9863097463fc02ff3c0b8b705ae61d9c75bfa14b4d796e746820546f6b656e1a028f45af111a004c4b401282825820187989e3bfd1e88597c93b1c2eadb7cfa767e9d5084e4755298b78248907297200825820d1ec9ca33f7d36ba26f6a979b98d13387e7aaf3c07b73b3ca51378c4fc4818b000a10582840100d879808219faf81a01407a9c840300d87980821a00041b0e1a04e9c7a7f5a119017aa163647374782a307833373131353864636562373534663537383664336436613838376431373761653364663131363833');

        const txHashIdFromHex = Cardano.hash_transaction(tx.body()).to_hex();
        console.log({txHashIdFromHex});

        expect(txHashId).toEqual(txHashIdFromHex);
    })
});