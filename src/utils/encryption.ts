import cryptoRandomString from "@b58-finance/crypto-random-string";
import Base, { CardanoType } from "../core/base";

class Encryption extends Base {

    encryptWithPassword(password: string, data:any): string {
        const dataHex = Buffer.from(data).toString('hex');
        const passwordHex = Buffer.from(password, 'utf8').toString('hex');
        const saltHex = cryptoRandomString({ length: 2 * 32 });
        const nonceHex = cryptoRandomString({ length: 2 * 12 });
        
        return this.Cardano.encrypt_with_password(
            passwordHex,
            saltHex,
            nonceHex,
            dataHex
        );
    }

    decryptWithPassword(password: string, encryptedData:string): string {
        try {
            const passwordHex = Buffer.from(password, 'utf8').toString('hex');
            const decryptedHex = this.Cardano.decrypt_with_password(
                passwordHex,
                encryptedData
            );

            return decryptedHex;
        } catch (error) {
            console.log(error)
            throw new Error("Wrong Password");
        }
    }
}

export default (Cardano:CardanoType) => (new Encryption(Cardano))