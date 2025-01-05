import { mnemonicToSeedSync } from 'bip39';
import { BtcWallet } from '../../../types/BitcoinWallet';
import Base from '../../base';
import Utils from '../../../utils';

class BitcoinAccount extends Base {

  createAccountWallet(
    mnemonic: string,
    index: number,
    network: 'Mainnet' | 'Testnet',
    password: string
  ): BtcWallet {
    if(!this.Bitcoin){
        throw Error('Bitcoinjs lib not loaded');
    }

    const bitcoin = this.Bitcoin.lib;

    bitcoin.initEccLib(this.Bitcoin.ecc);
    const bip32 = this.Bitcoin.bip32.BIP32Factory(this.Bitcoin.ecc);

    const seed = mnemonicToSeedSync(mnemonic);

    // Derive the HD wallet root key from the seed
    const root = bip32.fromSeed(seed as any);
    const wif = root.toWIF();

    console.log({wif})
    console.log(root.toBase58())

    const encryptedPhrase = Utils.Encryption(this.Cardano).encryptWithPassword(
      password,
      mnemonic
    );

    const encryptedWif = Utils.Encryption(this.Cardano).encryptWithPassword(
      password,
      wif
    );

    // Derive the account key from the root key (e.g., m/44'/0'/0)
    // const accountKey = root.derivePath("m/44'/0'/0");

    // derive segwit btc address
    const btcChild = root
      .deriveHardened(49)
      .deriveHardened(0)
      .deriveHardened(0)
      .derive(0)
      .derive(index);

    const segwitBtcAddress = bitcoin.payments.p2sh({
      redeem: bitcoin.payments.p2wpkh({
        pubkey: btcChild.publicKey,
        network:
          network === 'Mainnet'
            ? bitcoin.networks.bitcoin
            : bitcoin.networks.testnet,
      }),
      pubkey: btcChild.publicKey,
      network:
          network === 'Mainnet'
            ? bitcoin.networks.bitcoin
            : bitcoin.networks.testnet,
    });

    // derive taproot btc address
    const taprootBtcChild = root
      .deriveHardened(86)
      .deriveHardened(0)
      .deriveHardened(0)
      .derive(0)
      .derive(index);

    const ordinalsKey = taprootBtcChild.publicKey.slice(1);
    const ordinalsAddress = bitcoin.payments.p2tr({
      internalPubkey: ordinalsKey,
      network: bitcoin.networks.bitcoin,
    }).address!;

    const masterPubKey = Buffer.from(root.publicKey as any).toString('hex');
    const btcAddress = segwitBtcAddress.address!;
    const btcPublicKey = Buffer.from(btcChild.publicKey as any).toString('hex');
    const ordinalsPublicKey = Buffer.from(taprootBtcChild.publicKey as any).toString(
      'hex'
    );

    return {
      btcAddress,
      ordinalsAddress,
      btcPublicKey,
      ordinalsPublicKey,
      masterPubKey,
      encryptedPhrase,
      encryptedWif,
    };
  }
}

export default BitcoinAccount;
