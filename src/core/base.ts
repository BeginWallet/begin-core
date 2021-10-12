import { CardanoSerializationLib } from "@cardano-sdk/core";

class Base {

    Cardano:CardanoSerializationLib;

    constructor(_Cardano:CardanoSerializationLib) {
        this.Cardano = _Cardano;
    }
}

export default Base