// import type { Address as CardanoAddress, ByronAddress } from "../../temp_modules/@dcspark/cardano-multiplatform-lib-browser"
import type { Address as CardanoAddress, ByronAddress } from "@dcspark/cardano-multiplatform-lib-browser";
import { CARDANO_NETWORK_ID, NETWORK_ID } from "../config/config";
import { NetworkInfo } from "./account";
import Base from "./base"; 

export const enum ADDRESS_TYPE {
    Base = 'hbas_',
    Reward = 'hrew_'
}

class Address extends Base {

    getAddress(addressBech32:string): string {
        const address = Buffer.from(
            this.Cardano.Address
                .from_bech32(addressBech32)
                .to_raw_bytes()
        ).toString('hex');

        return address
    }

    extractKeyHash(address: string, networkInfo:NetworkInfo){

        const addressFromBech32 = address.startsWith('addr1') ? this.getAddress(address) : address;
        
        if (!this.isValidAddress(Buffer.from(addressFromBech32, 'hex'), networkInfo)) {
            throw new Error("Address Invalid Format");
        }

        const paymentAddr = this.extractKeyHashFromAddress(addressFromBech32, ADDRESS_TYPE.Base);

        if (paymentAddr.addressKeyHash && !paymentAddr.error) {
            return paymentAddr.addressKeyHash;
        }

        if (paymentAddr.error) {
            const rewardAddr = this.extractKeyHashFromAddress(addressFromBech32, ADDRESS_TYPE.Reward);

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
                    this.Cardano.Address.from_hex(address)
                );
                addressKeyHash = addressFrom?.payment().as_pub_key()?.to_bech32(addressType)
            } else if (addressType === ADDRESS_TYPE.Reward) {
                addressFrom = this.Cardano.RewardAddress.from_address(
                    this.Cardano.Address.from_hex(address)
                );
            }
            addressKeyHash = addressFrom?.payment().as_pub_key()?.to_bech32(addressType)

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
            return (addressValidator.validAddress as CardanoAddress).to_raw_bytes();
        }

        if (addressValidator.error){
            addressValidator = this.validateByronAddress(address, networkInfo)

            if (addressValidator.validAddress !== null && !addressValidator.error) {
                console.log((addressValidator.validAddress as ByronAddress).to_cbor_hex())
                return (addressValidator.validAddress as ByronAddress).to_cbor_bytes();
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
                addressFrom = this.Cardano.Address.from_raw_bytes(address);
            }

            validAddress = this.addressFromNetwork(addressFrom, networkInfo);
        } catch (err) {
            // console.error(err)
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
                addressFrom = this.Cardano.ByronAddress.from_cbor_bytes(address);
            }
            validAddress = this.addressFromNetwork(addressFrom, networkInfo);
        } catch (err) {
            // console.error(err)
            error = true
        }

        return { validAddress, error }
    }

    private addressFromNetwork( 
        addressFrom: CardanoAddress | ByronAddress, 
        networkInfo: NetworkInfo): CardanoAddress | ByronAddress | null {
        const isByron = addressFrom instanceof this.Cardano.ByronAddress;
        const addressFromChecked = isByron ? addressFrom : addressFrom;
    
        let networkId;

        if (isByron){
            networkId = (addressFromChecked as ByronAddress).to_address().network_id()
        } else {
            networkId = (addressFromChecked as CardanoAddress).network_id()
        }
        if (
            (networkId === CARDANO_NETWORK_ID.mainnet &&
            networkInfo.name === NETWORK_ID.mainnet) ||
            (networkId === CARDANO_NETWORK_ID.testnet &&
            networkInfo.name === NETWORK_ID.testnet)
        ) {
            return addressFromChecked;
        }
        return null
    }
    
}

export default Address