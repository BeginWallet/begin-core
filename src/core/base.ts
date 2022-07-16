import type * as CardanoSerializerType from "@emurgo/cardano-serialization-lib-browser"
import type * as CardanoMessageType from "@emurgo/cardano-message-signing-browser"

export type CardanoType = typeof CardanoSerializerType;
export type MessageType = typeof CardanoMessageType;

class Base {

    Cardano:CardanoType;
    Message:MessageType | undefined;

    constructor(_Cardano:CardanoType, _Message?: MessageType) {
        this.Cardano = _Cardano;
        this.Message = _Message;
    }
}

export default Base