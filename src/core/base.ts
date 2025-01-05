// import type * as CardanoSerializerType from "../../temp_modules/@dcspark/cardano-multiplatform-lib-browser"
import type * as CardanoSerializerType from "@dcspark/cardano-multiplatform-lib-browser"
import type * as CardanoMessageType from "@emurgo/cardano-message-signing-browser"
import type * as BitcoinjsType from 'bitcoinjs-lib';
import type * as EccjsType from 'tiny-secp256k1';
import type * as BIP32Type from 'bip32';
import type * as ECPairFactoryType from 'ecpair';
import type * as BS58checkType from 'bs58check';

export type CardanoType = typeof CardanoSerializerType;
export type MessageType = typeof CardanoMessageType;
export type BitcoinJsType = {
    lib: typeof BitcoinjsType;
    ecc: typeof EccjsType;
    bip32: typeof BIP32Type;
    ecpair?: typeof ECPairFactoryType;
    bs58check?: typeof BS58checkType.default;
};

class Base {

    Cardano:CardanoType;
    Message:MessageType | undefined;
    Bitcoin: {
        lib : typeof BitcoinjsType;
        ecc: typeof EccjsType;
        bip32: typeof BIP32Type;
        ecpair?: typeof ECPairFactoryType;
        bs58check?: typeof BS58checkType.default;
    } | undefined
    

    constructor(_Cardano:CardanoType, _Message?: MessageType, _Bitcoin?: BitcoinJsType) {
        this.Cardano = _Cardano;
        this.Message = _Message;
        this.Bitcoin = _Bitcoin;
    }
}

export default Base