// import { mnemonicToSeedSync } from 'bip39';
// import { BtcWallet } from '../../../types/BitcoinWallet';
import Base from '../../base';
import Utils from '../../../utils';

class BitcoinTransaction extends Base {
  // Define Dogecoin network parameters
  dogecoin = {
    messagePrefix: '\x19Dogecoin Signed Message:\n',
    bech32: 'dc',
    bip32: {
      public: 0x02facafd,
      private: 0x02fac398,
    },
    pubKeyHash: 0x1e,
    scriptHash: 0x16,
    wif: 0x9e,
  };

  // LEB128 Encoding Function
  leb128Encode(value: bigint) {
    value = BigInt(value);
    let bytes = [];
    while (true) {
      let byte = Number(value & BigInt(0x7f));
      value >>= 7n;
      if (value === 0n) {
        bytes.push(byte);
        break;
      } else {
        bytes.push(byte | 0x80);
      }
    }
    return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Encode string function
  encodeString(input: string) {
    let parts = input.split(':');
    if (parts.length !== 2) {
      throw new Error('Input must be in the format "number:number"');
    }

    let num1 = parseInt(parts[0], 10);
    let num2 = parseInt(parts[1], 10);

    if (isNaN(num1) || isNaN(num2)) {
      throw new Error('Both parts of the input must be valid integers');
    }

    let encodedNum1 = this.leb128Encode(BigInt(num1));
    let encodedNum2 = this.leb128Encode(BigInt(num2));

    return encodedNum1 + encodedNum2;
  }

  build(
    receiver: string,
    encryptedWif: string,
    password: string,
    utxos: any[],
    amount: string,
    feeAmount: number,
    tokens: any[],
    network: 'Mainnet' | 'Testnet',
    chain: 'BTC' | 'DOGE'
  ) {
    if (!this.Bitcoin || !this.Bitcoin.ecpair) {
      throw Error('Bitcoinjs lib not loaded');
    }

    const bitcoin = this.Bitcoin.lib;
    bitcoin.initEccLib(this.Bitcoin.ecc);
    // const bip32 = this.Bitcoin.bip32.BIP32Factory(this.Bitcoin.ecc);
    const ECPair = this.Bitcoin.ecpair.ECPairFactory(this.Bitcoin.ecc)

    try {
      const wif = Buffer.from(Utils.Encryption(this.Cardano).decryptWithPassword(
        password,
        encryptedWif
      ), 'hex').toString();

      // Define network
      let paymentNetwork;

      if (chain === 'BTC') {
        paymentNetwork =
          network === 'Mainnet'
            ? bitcoin.networks.bitcoin
            : bitcoin.networks.testnet;
      } else if (chain === 'DOGE') {
        paymentNetwork = this.dogecoin;
      } else {
        throw Error('Unsupported network');
      }

      const keyPair = ECPair.fromWIF(wif, paymentNetwork);

      // Define the payment method
      let payment;
      if (chain === 'BTC') {
        payment = bitcoin.payments.p2wpkh({
          pubkey: keyPair.publicKey,
          network: paymentNetwork,
        });
      } else if (chain === 'DOGE') {
        payment = bitcoin.payments.p2pkh({
          pubkey: keyPair.publicKey,
          network: paymentNetwork,
        });
      }

      const address = payment?.address;

      if (!address) {
        throw Error('Invalid account address');
      }
      // let utxosResponse = undefined;

      // Get UTXOs for the address
      // try {
      //   utxosResponse = await axios.get(`${apiBaseUrl}/addresses/${address}/utxos`, {
      //     headers: { 'api-key': apiKey }
      //   });
      //   console.log(utxosResponse.data); // Log the response data to the console
      // } catch (error) {
      //   console.log(error);
      //   return {
      //     statusCode: 200,
      //     body: JSON.stringify({
      //       satoshis: 0,
      //       runes: []
      //     }),
      //   };
      // }

      if(tokens) {
        console.log({tokens})
      }

      // let utxos;
      // if (token) {
      //   // Use all UTXOs, including those with runes
      //   utxos = utxosResponse.data.data;
      // } else {
      //   // Filter UTXOs for Bitcoin to exclude those with runes
      //   utxos = chain === 'BTC'
      //     ? utxosResponse.data.data.filter(utxo => utxo.runes.length === 0)
      //     : utxosResponse.data.data;
      // }
      console.log(utxos);

      // Create PSBT
      let psbt = new bitcoin.Psbt({ network: paymentNetwork });

      // TODO: check for tokens:
      let token = false;

      // TODO: build tokens support:
      let unit = '',
        decimals = 0;

      let inputSum = 0;
      let tokenInputSum = BigInt(0);
      let tokenAmount = token
        ? BigInt(parseFloat(amount) * 10 ** decimals)
        : BigInt(0);

      for (const utxo of utxos) {
        if (
          token &&
          utxo.runes &&
          utxo.runes.some((rune: any) => rune.rune_id === unit)
        ) {
          for (const rune of utxo.runes) {
            if (rune.rune_id === unit) {
              tokenInputSum += BigInt(rune.amount);
            }
          }
        }

        const inputParams: any = {
          hash: utxo.txid,
          index: utxo.vout,
          sequence: 0xfffffffd, // BIP-68 nSequence for replacement transactions
        };

        if (chain === 'BTC') {

          inputParams.witnessUtxo = {
            script: payment?.output,
            value: parseInt(utxo.satoshis, 10),
          };
          // } else if (chain === 'DOGE') {
          //   // Fetch the full transaction hex for nonWitnessUtxo
          //   const txHexResponse = await axios.get(`${apiBaseUrl}/transactions/${utxo.txid}`, {
          //     headers: { 'api-key': apiKey }
          //   });
          //   inputParams.nonWitnessUtxo = Buffer.from(txHexResponse.data.data.hex, 'hex');
        }

        console.warn(inputParams.witnessUtxo)

        psbt.addInput(inputParams);
        inputSum += parseInt(utxo.satoshis, 10);

        if (token && tokenInputSum >= tokenAmount && inputSum > feeAmount) {
          break;
        }
      }

      if (token && tokenInputSum < tokenAmount) {
        throw new Error('Insufficient token funds');
      }

      const amountToSend = token ? tokenAmount : BigInt(parseFloat(amount));
      const isBTC = chain === 'BTC' ? true : false; // Set this to false if it's DOGE

      const changeAmount = token
        ? BigInt(inputSum) -
          (isBTC ? BigInt(546) : BigInt(100000)) -
          BigInt(feeAmount)
        : BigInt(inputSum) - amountToSend - BigInt(feeAmount);
      console.log(amountToSend);
      console.log(changeAmount);

      if (changeAmount < 0) {
        console.log('zioo non hai soldi');
        throw new Error('Insufficient funds');
      }

      // Add outputs
      if (token) {
        psbt.addOutput({
          address: receiver,
          value: chain === 'BTC' ? Number(BigInt(546).valueOf()) : Number(BigInt(100000).valueOf()),
        });

        psbt.addOutput({
          address: address,
          value: chain === 'BTC' ? Number(BigInt(546).valueOf()) : Number(BigInt(100000).valueOf()),
        });

        const hexString =
          '160100' +
          this.encodeString(unit) +
          this.leb128Encode(tokenAmount) +
          '00';
        const totalSize = hexString.length / 2; // Each hex character represents 4 bits (half a byte)
        const hexResult =
          (chain === 'DOGE' ? '6a0144' : '6a5d') +
          totalSize.toString(16).padStart(2, '0') +
          hexString;

        console.log(hexResult);

        psbt.addOutput({
          script: Buffer.from(hexResult, 'hex'),
          value: 0,
        });
      } else {
        psbt.addOutput({
          address: receiver,
          value: Number(BigInt(amountToSend).valueOf()),
        });
      }

      if (changeAmount > 0) {
        psbt.addOutput({
          address: address, // Change back to sender
          value: Number(BigInt(changeAmount).valueOf()),
        });
      }

      // Sign all inputs
      psbt.signAllInputs(keyPair);

      // Finalize inputs
      psbt.finalizeAllInputs();

      // Extract the transaction
      const tx = psbt.extractTransaction().toHex();
      return tx;
    } catch (error) {
      console.error(error);
      throw Error('Not able to build transaction.');
    }
  }
}

export default BitcoinTransaction;
