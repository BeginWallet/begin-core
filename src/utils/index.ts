import Encryption from "./encryption"

const purpose:number = 1852
const coinType:number = 1815 // Cardano ADA

const harden = (num: number): number => {
    return 0x80000000 + num;
}

type utilsType = {
    Encryption: typeof Encryption,
    harden: typeof harden
    purpose: number,
    coinType: number,
}

const Utils:utilsType = {
    Encryption,
    harden,
    purpose,
    coinType
}
export default Utils

// TODO: Implement it all helpers
// Reference here
// >>> https://github.com/Berry-Pool/nami-wallet/blob/de2a202eac291d13fc6a95610ad2b47cdbdc1dde/src/api/util.js#L204

// export const utxoFromJson = async (output, address) => {
//     await Loader.load();
//     return Loader.Cardano.TransactionUnspentOutput.new(
//       Loader.Cardano.TransactionInput.new(
//         Loader.Cardano.TransactionHash.from_bytes(
//           Buffer.from(output.tx_hash || output.txHash, 'hex')
//         ),
//         output.output_index || output.txId
//       ),
//       Loader.Cardano.TransactionOutput.new(
//         Loader.Cardano.Address.from_bytes(Buffer.from(address, 'hex')),
//         await assetsToValue(output.amount)
//       )
//     );
//   };