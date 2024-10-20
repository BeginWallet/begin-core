// import KeystoneSDK, { CardanoSignRequestProps, UREncoder } from "@keystonehq/keystone-sdk";
// import KeystoneWallet from '../src/core/keystonehq';

describe('Test Keystone SDK', () => {
    it('Generate Cardano signature', () => {
        try {
            // KeystoneWallet()
        } catch (error) {
            console.error(error);
            throw error;
        }
        

        // const cardanoSignRequest: CardanoSignRequestProps = {

        // signData: Buffer.from(
        //     '84a400828258204e3a6e7fdcb0d0efa17bf79c13aed2b4cb9baf37fb1aa2e39553d5bd720c5c99038258204e3a6e7fdcb0d0efa17bf79c13aed2b4cb9baf37fb1aa2e39553d5bd720c5c99040182a200581d6179df4c75f7616d7d1fd39cbc1a6ea6b40a0d7b89fea62fc0909b6c370119c350a200581d61c9b0c9761fd1dc0404abd55efc895026628b5035ac623c614fbad0310119c35002198ecb0300a0f5f6',
        //     'hex'
        // ),
        // utxos: [
        //     {
        //     transactionHash: '4e3a6e7fdcb0d0efa17bf79c13aed2b4cb9baf37fb1aa2e39553d5bd720c5c99',
        //     index: 3,
        //     amount: '10000000',
        //     xfp: '73c5da0a',
        //     hdPath: "m/1852'/1815'/0'/0/0",
        //     address:
        //         'addr1qy8ac7qqy0vtulyl7wntmsxc6wex80gvcyjy33qffrhm7sh927ysx5sftuw0dlft05dz3c7revpf7jx0xnlcjz3g69mq4afdhv',
        //     },
        //     {
        //     transactionHash: '4e3a6e7fdcb0d0efa17bf79c13aed2b4cb9baf37fb1aa2e39553d5bd720c5c99',
        //     index: 4,
        //     amount: '18020000',
        //     xfp: '73c5da0a',
        //     hdPath: "m/1852'/1815'/0'/0/1",
        //     address:
        //         'addr1qyz85693g4fr8c55mfyxhae8j2u04pydxrgqr73vmwpx3azv4dgkyrgylj5yl2m0jlpdpeswyyzjs0vhwvnl6xg9f7ssrxkz90',
        //     },
        // ],
        // extraSigners: [
        //     {
        //     keyHash: 'e557890352095f1cf6fd2b7d1a28e3c3cb029f48cf34ff890a28d176',
        //     xfp: '73c5da0a',
        //     keyPath: "m/1852'/1815'/0'/2/0",
        //     },
        // ],
        // requestId: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
        // origin: 'cardano-wallet',
        // };

        // console.log({ cardanoSignRequest });

        // const keystoneSDK = new KeystoneSDK();

        // console.log({ cardanoSignRequest });
        // const ur = keystoneSDK.cardano.generateSignRequest(cardanoSignRequest);
        // const encoder = new UREncoder(ur, 200);
        // console.log(encoder.encodeWhole());

        // console.log('cbor', ur.cbor.toString('hex'));
        // console.log('type', ur.type);
        // console.log(new UREncoder(ur, 20000).encodeWhole());

    });
});