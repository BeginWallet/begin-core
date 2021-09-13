import type * as CardanoSerializerType from "@emurgo/cardano-serialization-lib-asmjs"

export type CardanoType = typeof CardanoSerializerType;

class Base {

    Cardano:CardanoType;

    constructor(_Cardano:CardanoType) {
        this.Cardano = _Cardano;
    }
}

export default Base