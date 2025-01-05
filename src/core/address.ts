// import type { Address as CardanoAddress, ByronAddress } from "../../temp_modules/@dcspark/cardano-multiplatform-lib-browser"
import type { Address as CardanoAddress, ByronAddress, PlutusScript } from "@dcspark/cardano-multiplatform-lib-browser";
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
        
        if (!this.isValidAddress(Buffer.from(addressFromBech32, 'hex') as any, networkInfo)) {
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

    makeProgrammableTokenAddress(address: string): string {
        const addressFrom = this.Cardano.BaseAddress.from_address(
            this.Cardano.Address.from_bech32(address)
        );

        if (!addressFrom) {
            throw Error('Invalid Address');
        }
        // const addressKeyHash = addressFrom?.payment().as_pub_key()?.to_bech32(ADDRESS_TYPE.Reward)

        // const paymentCredential = addressKeyHash
        
        // From https://github.com/input-output-hk/wsc-poc/blob/main/compiled-prod/programmableLogicBase.json
        // Cardano JS SDK currently does not support applying parameters to scripts yet, so we would need to use something like
        // https://npmjs.com/package/@lucid-evolution/uplc
        // const programmableLogicBase: PlutusScript = {
        // __type: this.Cardano.ScriptType.Plutus,
        // bytes: HexBlob(
        // '58845882010000223253335734a666ae68cdd79aab9d3574200200629444cc8c8c8c0088cc0080080048c0088cc008008004894ccd55cf8008b0a999ab9a30033574200229444c008d5d1000919baf35573a0020086ae88004526163756646ae84c8d5d11aba2357446ae88d5d11aba20013235573c6ea8004004d5d0991aab9e37540020021'
        // ),
        // version: Cardano.PlutusLanguageVersion.V3
        // };

        const SCRIPT_HEX = '58845882010000223253335734a666ae68cdd79aab9d3574200200629444cc8c8c8c0088cc0080080048c0088cc008008004894ccd55cf8008b0a999ab9a30033574200229444c008d5d1000919baf35573a0020086ae88004526163756646ae84c8d5d11aba2357446ae88d5d11aba20013235573c6ea8004004d5d0991aab9e37540020021'

        const programmableLogicBase: PlutusScript = this.Cardano.PlutusScript.from_v3(
            this.Cardano.PlutusV3Script.from_raw_bytes(Buffer.from(SCRIPT_HEX, 'hex') as any)
        );
        
        const scriptHash = programmableLogicBase.hash();
        
        return this.Cardano.BaseAddress.new(
            addressFrom.network_id(),
            this.Cardano.Credential.new_script(scriptHash),
            addressFrom.payment()
        )
        .to_address()
        .to_bech32();
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