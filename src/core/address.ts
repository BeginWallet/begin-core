import { Address as CardanoAddress, ByronAddress } from "@emurgo/cardano-serialization-lib-asmjs";
import { CARDANO_NETWORK_ID, NETWORK_ID } from "../config/config";
import { NetworkInfo } from "./account";
import Base, { CardanoType } from "./base"; 

export const enum ADDRESS_TYPE {
    Base = 'hbas_',
    Reward = 'hrew_'
}

class Address extends Base {

    getAddress(addressBech32:string): string {
        const address = Buffer.from(
            this.Cardano.Address
                .from_bech32(addressBech32)
                .to_bytes()
        ).toString('hex');

        return address
    }

    extractKeyHash(address: string, networkInfo:NetworkInfo){
        
        if (!this.isValidAddress(Buffer.from(address, 'hex'), networkInfo)) {
            throw new Error("Address Invalid Format");
        }

        const paymentAddr = this.extractKeyHashFromAddress(address, ADDRESS_TYPE.Base);

        if (paymentAddr.addressKeyHash && !paymentAddr.error) {
            return paymentAddr.addressKeyHash;
        }

        if (paymentAddr.error) {
            const rewardAddr = this.extractKeyHashFromAddress(address, ADDRESS_TYPE.Reward);

            if (rewardAddr.addressKeyHash && !rewardAddr.error){
                return rewardAddr.addressKeyHash;
            }
        }

        throw new Error("Address not PK");
    }

    private extractKeyHashFromAddress(address: string, addressType: string) {
        let addressKeyHash: string | null | undefined = null;
        let error: boolean = false;
        try {
            let addressFrom;
            if (addressType === ADDRESS_TYPE.Base) {
                addressFrom = this.Cardano.BaseAddress.from_address(
                    this.Cardano.Address.from_bytes(Buffer.from(address, 'hex'))
                );
                addressKeyHash = addressFrom?.payment_cred().to_keyhash()?.to_bech32(addressType)
            } else if (addressType === ADDRESS_TYPE.Reward) {
                addressFrom = this.Cardano.RewardAddress.from_address(
                    this.Cardano.Address.from_bytes(Buffer.from(address, 'hex'))
                );
            }
            addressKeyHash = addressFrom?.payment_cred().to_keyhash()?.to_bech32(addressType)

            if (!addressKeyHash) {
                throw new Error("Not a valid Address");
            }
        } catch (err) {
            error = true
        }

        return { addressKeyHash, error }
    }

    isValidAddress(address: string | Uint8Array, networkInfo: NetworkInfo): Uint8Array | boolean {
        if (typeof address === 'string') {
            return this.validateAddressFromString(
                address,
                networkInfo
            )
        } else if(address instanceof Uint8Array) {
            return this.validateAddressFromBytes(
                address,
                networkInfo
            )
        }
        
        return false
    }

    private validateAddressFromString(address: string, networkInfo: NetworkInfo): Uint8Array | boolean {
        let addressValidator = this.validateShelleyAddress(address, networkInfo);

        if (addressValidator.validAddress !== null && !addressValidator.error) {
            return addressValidator.validAddress.to_bytes();
        }

        if (addressValidator.error){
            addressValidator = this.validateByronAddress(address, networkInfo)

            if (addressValidator.validAddress !== null && !addressValidator.error) {
                return (addressValidator.validAddress as ByronAddress).to_address().to_bytes();
            }
        }

        return false
    }

    private validateAddressFromBytes(address: Uint8Array, networkInfo: NetworkInfo): boolean {
        let addressValidator = this.validateShelleyAddress(address, networkInfo);

        if (addressValidator.validAddress !== null && !addressValidator.error) {
            return true;
        }

        if (addressValidator.error){
            addressValidator = this.validateByronAddress(address, networkInfo)

            if( addressValidator.validAddress !== null && !addressValidator.error) {
                return true;
            }
        }
        
        return false
    }


    private validateShelleyAddress(address: string | Uint8Array, networkInfo: NetworkInfo) {
        let validAddress: CardanoAddress | ByronAddress | null = null;
        let error: boolean = false;
        try {
            let addressFrom;
            if (typeof address === 'string') {
                addressFrom = this.Cardano.Address.from_bech32(address);
            } else {
                addressFrom = this.Cardano.Address.from_bytes(address);
            }

            validAddress = this.addressFromNetwork(addressFrom, networkInfo);
        } catch (err) {
            error = true
        }

        return { validAddress, error }
    }

    private validateByronAddress(address: string | Uint8Array, networkInfo: NetworkInfo) {
        let validAddress: CardanoAddress | ByronAddress | null = null;
        let error: boolean = false;
        try {
            let addressFrom;
            if (typeof address === 'string') {
                addressFrom = this.Cardano.ByronAddress.from_base58(address);
            } else {
                addressFrom = this.Cardano.ByronAddress.from_bytes(address);
            }
            validAddress = this.addressFromNetwork(addressFrom, networkInfo);
        } catch (err) {
            error = true
        }

        return { validAddress, error }
    }

    private addressFromNetwork( 
        addressFrom: CardanoAddress | ByronAddress, 
        networkInfo: NetworkInfo): CardanoAddress | ByronAddress | null {
        if (
            (addressFrom.network_id() === CARDANO_NETWORK_ID.mainnet &&
            networkInfo.name === NETWORK_ID.mainnet) ||
            (addressFrom.network_id() === CARDANO_NETWORK_ID.testnet &&
            networkInfo.name === NETWORK_ID.testnet)
        ) {
            return addressFrom;
        }
        return null
    }
    
}

export default (Cardano:CardanoType) => (new Address(Cardano))