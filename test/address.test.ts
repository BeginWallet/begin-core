import { Core } from "../src";
import * as Cardano from '@dcspark/cardano-multiplatform-lib-browser';
import {
    TransactionInput,
    TransactionOutput,
    TransactionUnspentOutput,
    Value,
    Address,
    BigNum,
    TransactionHash,
    Assets,
    AssetName,
    MultiAsset,
    ScriptHash,
    NetworkInfo,
    ByronAddress,
    BaseAddress,
    RewardAddress,
  } from '@dcspark/cardano-multiplatform-lib-browser';
import { NETWORK_ID } from "../src/config/config";
import { ADDRESS_TYPE } from "../src/core/address";

const networkInfo = {
    id: Cardano.NetworkInfo.testnet().network_id(),
    name: NETWORK_ID.testnet,
};

const networkInfoMainnet = {
    id: Cardano.NetworkInfo.mainnet().network_id(),
    name: NETWORK_ID.mainnet,
};

describe('Get Addresses from Bech32', () => {
    it('Payment Address returned', () => {
        const paymentAddrBech32 = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';
        const rewardAddrBech32 = 'stake_test1uqevw2xnsc0pvn9t9r9c7qryfqfeerchgrlm3ea2nefr9hqp8n5xl';

        const core = Core(Cardano).getInstance();
        const paymentAddr = core.Address.getAddress(paymentAddrBech32)
        const rewardAddr = core.Address.getAddress(rewardAddrBech32)
        
        expect(paymentAddr).toEqual(
            '009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc'
        );
        expect(rewardAddr).toEqual('e032c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc');
    });
});

describe('Extract Key Hash from Addresses', () => {
    it('Payment Address returned', () => {
        const paymentBytesHex = '009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc';

        // Same as BaseAddr
        const core = Core(Cardano).getInstance();
        const paymentAddr = core.Address.extractKeyHash(
            paymentBytesHex,
            networkInfo
        );

        expect(paymentAddr).toContain(ADDRESS_TYPE.Base);
        expect(paymentAddr).toEqual('hbas_1jjfnzhxe966a33psfenm0ct2udkkr569qf55v4uprgkgu53uxzn');
    });

    it('Reward Address returned', () => {
        const rewarBytesHex = 'e032c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc'
        
        const core = Core(Cardano).getInstance();
        const rewardAddr = core.Address.extractKeyHash(
            rewarBytesHex,
            networkInfo
        );

        expect(rewardAddr).toContain(ADDRESS_TYPE.Reward);
        expect(rewardAddr).toEqual('hrew_1xtrj35uxrctye2egew8sqezgzwwg796ql7uw02572gedcue5x6t'); 
    });

    it('Reward Mainnet Address returned', () => {
        const rewarBytesHex = 'e14faef712a5c7fd4397628537e8567850138992b2fcbc44e4acf9a48b'

        const instance = {
            Address,
            BigNum,
            Value,
            Assets,
            AssetName,
            MultiAsset,
            ScriptHash,
            TransactionHash,
            TransactionInput,
            TransactionOutput,
            TransactionUnspentOutput,
            NetworkInfo,
            ByronAddress,
            BaseAddress,
            RewardAddress,
          };
        
        const core = Core(instance as any).getInstance();
        const rewardAddr = core.Address.extractKeyHash(
            rewarBytesHex,
            networkInfoMainnet
        );

        expect(rewardAddr).toContain(ADDRESS_TYPE.Reward);
        expect(rewardAddr).toEqual('hrew_1f7h0wy49cl7589mzs5m7s4nc2qfcny4jlj7yfe9vlxjgkv3kp3j'); 
    });
});

describe('Validate Addresses', () => {
    it('String Address is valid', () => {
        const paymentAddrBech32 = 'addr_test1qz2fxv2umyhttkxyxp8x0dlpdt3k6cwng5pxj3jhsydzer3jcu5d8ps7zex2k2xt3uqxgjqnnj83ws8lhrn648jjxtwq2ytjqp';
        const rewardAddrBech32 = 'stake_test1uqevw2xnsc0pvn9t9r9c7qryfqfeerchgrlm3ea2nefr9hqp8n5xl';
        
        const core = Core(Cardano).getInstance();
        const isValidPaymentAddr = Buffer.from(
            core.Address.isValidAddress(
                paymentAddrBech32, 
                networkInfo) as Uint8Array
        ).toString('hex');

        const isValidRewardAddr = Buffer.from(
            core.Address.isValidAddress(
                rewardAddrBech32, 
                networkInfo) as Uint8Array
        ).toString('hex');

        expect(isValidPaymentAddr).toEqual(
            '009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc'
        );
        expect(isValidRewardAddr).toEqual('e032c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc');
    });

    it('Bytes Address is valid', () => {
        const paymentBytesHex = '009493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc';
        const rewarBytesHex = 'e032c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc';

        const core = Core(Cardano).getInstance();
        const isValidPaymentAddr = core.Address.isValidAddress(
            Buffer.from(paymentBytesHex, 'hex'), 
            networkInfo);

        const isValidRewardAddr = core.Address.isValidAddress(
            Buffer.from(rewarBytesHex, 'hex'), 
            networkInfo);

        expect(isValidPaymentAddr).toBeTruthy();
        expect(isValidRewardAddr).toBeTruthy();
    });

    it('Bytes Mainnet Address is valid', () => {
        const rewarBytesHex = 'e14faef712a5c7fd4397628537e8567850138992b2fcbc44e4acf9a48b';

        const core = Core(Cardano).getInstance();
        

        const isValidRewardAddr = core.Address.isValidAddress(
            Buffer.from(rewarBytesHex, 'hex'), 
            networkInfoMainnet);

        expect(isValidRewardAddr).toBeTruthy();
    });

    it('Byron Address String is valid', () => {
        //Generate a new byron address and test isValidAddress
        // const encryptedRootKey = '0217484437fd4764bac8b8fea4215a799dd0fc04801dd6c34ff4b6976e64608f02cfaa1dee7df8f7ec05ee86553d5da4845534b5795ee08ae4c8d678579b2339ebf4876a971dfe46bcb22933e146cc1b9413fe9d381e3be83cc082aa0fa41b29fee7625541dc347124c780d2ecc10050f2f741e0b5a92f6afe25aa34f35c612dfc429acb2143ffcd867568914f85b02d3f0570cab7fa127b7c1281f6';
        const core = Core(Cardano).getInstance();
        // const { paymentKey } = core.Account.generateAccountKeyPair(
        //         '12345678',
        //         0,
        //         encryptedRootKey
        //     );

        // const paymentPK = Cardano.Bip32PublicKey.from_bytes(paymentKey.as_bytes());

        // Fix it with new version of CSL
        // const byronAddr = Cardano.ByronAddress.icarus_from_key(
        //     paymentPK, // Ae2* style icarus address
        //     Cardano.NetworkInfo.testnet().protocol_magic()
        // );

        const byronAddr = Cardano.ByronAddress.from_base58('2cWKMJemoBakC6HuYgMEvFiodGBhkHLxomEuRGc9JnmECWMDsMv3CitvJGZNbXD6Gqq63');
        const isValidByronAddress = Buffer.from(
            core.Address.isValidAddress(
                byronAddr.to_base58(), //Output 2cWKMJemoBakC6HuYgMEvFiodGBhkHLxomEuRGc9JnmECWMDsMv3CitvJGZNbXD6Gqq63
                networkInfo) as Uint8Array
        ).toString('hex')

        expect(isValidByronAddress).toEqual(
            '82d818582883581cb78e58793d25b453b716a116d519567804b9ddcc6be3a802f23dc390a102451a4170cb17001a006f0174'
        );

        const byronAddr2 = 'DdzFFzCqrhsyXpee8uLYLEpMCTgEXcfo9BPeDWcf4iCbYq76WboggJrfGAwRjwDKXmJoyxoNngebVPGpRuqkSJLRCGwhq1WX1yeZms1h'
        const isValidByronAddress2 = core.Address.isValidAddress(
            byronAddr2, 
            {
            id: Cardano.NetworkInfo.mainnet().network_id(),
            name: NETWORK_ID.mainnet,
        });
        console.log('Mainnet B58', isValidByronAddress2)
        console.log('Mainnet CSL', Cardano.Address.is_valid(byronAddr2))
    });

    it('Byron Address Bytes is valid', () => {
        //Generate a new byron address and test isValidAddress
        // const byronAddrBytesHex = '82d818582883581cb78e58793d25b453b716a116d519567804b9ddcc6be3a802f23dc390a102451a4170cb17001a006f0174';
        const byronAddrBytes = Cardano.ByronAddress
            .from_base58('2cWKMJemoBakC6HuYgMEvFiodGBhkHLxomEuRGc9JnmECWMDsMv3CitvJGZNbXD6Gqq63')
            .to_bytes();
        
        const core = Core(Cardano).getInstance();
        const isValidByronAddress = core.Address.isValidAddress(
            byronAddrBytes,
            networkInfo);

        console.log(isValidByronAddress)
        expect(isValidByronAddress).toBeTruthy();
    });
});

describe('Exception Handling', () => {
    it('Should throw Address not PK', () => {
        const paymentBytesHex = '109493315cd92eb5d8c4304e67b7e16ae36d61d34502694657811a2c8e32c728d3861e164cab28cb8f006448139c8f1740ffb8e7aa9e5232dc';
        const core = Core(Cardano).getInstance();

        // Same as BaseAddr
        expect(() => {
            core.Address.extractKeyHash(
                paymentBytesHex,
                networkInfo
            );
        }
        ).toThrowError('Address not PK');
    });

});