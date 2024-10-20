import type { Bip32PrivateKey, PrivateKey } from "@dcspark/cardano-multiplatform-lib-browser";
// import type { Bip32PrivateKey, PrivateKey } from "../../temp_modules/@dcspark/cardano-multiplatform-lib-browser";
import { mnemonicToEntropy } from "bip39"
import { NETWORK_ID } from "../config/config";
import Utils from "../utils"
import Base from "./base"


interface AccountData {
    index: number,
    name: string,
    avatar: string, //TODO: Check to user Wallet Address #0
    publicKey: string,
    paymentPubKeyHash: string,
    stakePubKeyHash: string,
    [NETWORK_ID.mainnet]: AccountBalance,
    [NETWORK_ID.testnet]: AccountBalance,
}

interface AccountBalance {
    assets: any[],
    lovelace: BigInt,
    minAda: BigInt,
    history: any,
    recentSentAddrs: any[]
}

interface AccountWallet extends AccountData {
    encryptedRootKey: string
    encryptedPhrase: string
}

export interface AccountContext extends AccountData, AccountBalance {
    paymentAddr: string,
    rewardAddr: string,
}

interface AccountKeyPair {
    accountKey: Bip32PrivateKey,
    paymentKey: PrivateKey
    stakeKey: PrivateKey
}

export interface NetworkInfo {
    id: number
    name: NETWORK_ID,
}

enum KeyPurposeType {
    Payment = 0,
    Stake = 2,
}

class Account extends Base {

    createAccountWallet(name:string, password:string, mnemonic:string, accountIndex:number): AccountWallet{
        const rootKey = this.createRootKey(mnemonic)

        const encryptedRootKey = Utils.Encryption(this.Cardano).encryptWithPassword(
                password,
                rootKey.to_raw_bytes()
            );

        const encryptedPhrase = Utils.Encryption(this.Cardano).encryptWithPassword(
            password,
            mnemonic
        );

        const accountData = this.createAccount(name, password, accountIndex, encryptedRootKey)
        //Clear RootKey
        rootKey.free()

        return {
            ...accountData,
            encryptedRootKey,
            encryptedPhrase
        }
    }

    createAccount(name: string, password: string, 
        accountIndex:number, encryptedRootKey:string): AccountData {

        const { accountKey, paymentKey, stakeKey } = this.generateAccountKeyPair(
            password,
            accountIndex,
            encryptedRootKey
        )
        
        const publicKey = Buffer.from(accountKey.to_public().to_raw_bytes()).toString('hex');
        const paymentPubKey = paymentKey.to_public();
        const stakePubKey = stakeKey.to_public();

        accountKey.free();
        paymentKey.free();
        stakeKey.free();

        const paymentPubKeyHash = Buffer.from(
            paymentPubKey.hash().to_raw_bytes()
        ).toString('hex');
        const stakePubKeyHash = Buffer.from(
            stakePubKey.hash().to_raw_bytes()
        ).toString('hex');

        const networkDefault = {
            lovelace: BigInt(0),
            minAda: BigInt(0),
            assets: [],
            history: { confirmed: [], details: {} },
            recentSentAddrs: []
        };

        return {
            index: accountIndex,
            name,
            avatar: Math.random().toString(),
            publicKey,
            paymentPubKeyHash,
            stakePubKeyHash,
            mainnet: networkDefault,
            testnet: networkDefault,   
        }
    }

    createRootKey(mnemonic:string):Bip32PrivateKey {
        //Bip39 Root Key
        const entropy = mnemonicToEntropy(mnemonic);
        const EMPTY_PASSWORD = Buffer.from('');
        const rootKey = this.Cardano.Bip32PrivateKey.from_bip39_entropy(
            Buffer.from(entropy, 'hex'),
            EMPTY_PASSWORD,
        );

        return rootKey;
    }

    generateAccountKeyPair(password:string, accountIndex:number, encryptedRootKey:string): AccountKeyPair {
        try {
            const accountKey = this.Cardano.Bip32PrivateKey.from_raw_bytes(
                Buffer.from(
                    Utils.Encryption(this.Cardano).decryptWithPassword(
                        password,
                        encryptedRootKey
                    ),
                    'hex'
                )
            )
            .derive(Utils.harden(Utils.purpose))
            .derive(Utils.harden(Utils.coinType))
            .derive(Utils.harden(accountIndex))

            return {
                accountKey,
                paymentKey: accountKey.derive(KeyPurposeType.Payment).derive(0).to_raw_key(),
                stakeKey: accountKey.derive(KeyPurposeType.Stake).derive(0).to_raw_key()
            }   
        } catch (error) {
            throw new Error("Wrong Password");
        }
    }

    getAccount(accountData: AccountData, networkInfo: NetworkInfo): AccountContext {
        const paymentPubKeyHash = this.Cardano.Ed25519KeyHash.from_raw_bytes(
            Buffer.from(accountData.paymentPubKeyHash, 'hex')
        );
        const stakePubKeyHash = this.Cardano.Ed25519KeyHash.from_raw_bytes(
            Buffer.from(accountData.stakePubKeyHash, 'hex')
        );
        const paymentAddr = this.Cardano.BaseAddress.new(
            networkInfo.id,
            this.Cardano.Credential.new_pub_key(paymentPubKeyHash),
            this.Cardano.Credential.new_pub_key(stakePubKeyHash)
        )
        .to_address()
        .to_bech32();

        const rewardAddr = this.Cardano.RewardAddress.new(
            networkInfo.id,
            this.Cardano.Credential.new_pub_key(stakePubKeyHash)
        )
        .to_address()
        .to_bech32();

        const accountBalance = accountData[networkInfo.name];

        return {
            ...accountData,
            paymentAddr,
            rewardAddr,
            ...accountBalance,
        }
    }


}

export default Account