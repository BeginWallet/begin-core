// import type { TransactionOutputs, TransactionUnspentOutput } from '../../temp_modules/@dcspark/cardano-multiplatform-lib-browser';
import type { TransactionOutputList, TransactionUnspentOutput } from '@dcspark/cardano-multiplatform-lib-browser';
 
import { __values } from 'tslib';

const addr1 = 'addr_test1qpq2eurm8qy7xgprcevsfy7daxp069m7w2sf5wkfyvyfsu7y9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqz2d94g';
const addr2 = 'addr_test1qqs6t4pym4ye2j5x99mlf6twwve48kw6wta4quh54muhagky9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqa8nufl';

const CardanoLib = async () =>
  // await import('../../temp_modules/@dcspark/cardano-multiplatform-lib-nodejs')
  await import('@dcspark/cardano-multiplatform-lib-nodejs')

export namespace MockMultiAsset {
  export const getMockInputsUtxos = async () => {
    //Generate inputs
    const Cardano = await CardanoLib();
  
    // const inputs: Set<Cardano.TransactionUnspentOutput> = new Set();
    const inputs: TransactionUnspentOutput[] = [];
  
    let input = Cardano.TransactionUnspentOutput.new(
      Cardano.TransactionInput.new(
        Cardano.TransactionHash.from_raw_bytes(
          Buffer.from('bc37156be94099045706843d4c6663ffc0feb67ee76f91165b4ba37cde55c57e', 'hex')
        ),
        0n
      ),
      Cardano.TransactionOutput.new(
        Cardano.Address.from_bech32(addr1), // Cardano.Address.from_bytes(Buffer.from(addr1, 'hex'))
        Cardano.Value.new(Cardano.BigInteger.from_str('12214300').as_u64() || 0n, Cardano.MultiAsset.new())
      )
    );
  
    inputs.push(input);
  
    const _multiAsset = Cardano.MultiAsset.new();
    const _asset = Cardano.MapAssetNameToCoin.new();
    _asset.insert(
      Cardano.AssetName.from_raw_bytes(
        Buffer.from('6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7', 'hex')
      ),
      1n
    );
    _multiAsset.insert_assets(
      Cardano.ScriptHash.from_raw_bytes(
        Buffer.from('6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7', 'hex')
      ),
      _asset
    );

    const _value = Cardano.Value.new(Cardano.BigInteger.from_str('2000000').as_u64() || 0n, _multiAsset);

    //Cardano.Value.new(BigNum.from_str('2000000'))
    input = Cardano.TransactionUnspentOutput.new(
      Cardano.TransactionInput.new(
        Cardano.TransactionHash.from_raw_bytes(
          Buffer.from('b70dc9e051913b9b4a34b95cf518041c00ac1dee73ba35e77b0badb1f156ff33', 'hex')
        ),
        0n
      ),
      Cardano.TransactionOutput.new(
        Cardano.Address.from_bech32(addr1), // Cardano.Address.from_bytes(Buffer.from(addr1, 'hex'))
        _value
      )
    );

    if (input.output().amount().multi_asset())
      console.log(input.output().amount().multi_asset())
    
    console.log(Buffer.from(_asset.keys().get(0).to_raw_bytes()).toString('hex'))
  
    inputs.push(input);
  
    return inputs;
  }
  
  export const getMockOutputs = async () => {
    //Generate outputs
    const Cardano = await CardanoLib();
    // const outputs: Set<Cardano.TransactionOutput> = new Set();
    const outputs: TransactionOutputList = Cardano.TransactionOutputList.new();
  
    let output = Cardano.TransactionOutput.new(
      Cardano.Address.from_bech32(addr2), // Cardano.Address.from_bytes(Buffer.from(addr2, 'hex'))
      Cardano.Value.new(Cardano.BigInteger.from_str('1300000').as_u64() || 0n, Cardano.MultiAsset.new())
    )
  
    outputs.add(output);

    const _multiAsset = Cardano.MultiAsset.new();
    const _asset = Cardano.MapAssetNameToCoin.new();
    _asset.insert(
      Cardano.AssetName.from_hex('6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7'),
      1n
    );
    _multiAsset.insert_assets(
      Cardano.ScriptHash.from_hex(
        '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7'
      ),
      _asset
    );

    const _value = Cardano.Value.new(Cardano.BigInteger.from_str('2000000').as_u64() || 2n, Cardano.MultiAsset.new());

    //Cardano.Value.new(BigNum.from_str('2000000'))
  
    output = Cardano.TransactionOutput.new(
      Cardano.Address.from_bech32(addr2), // Cardano.Address.from_bytes(Buffer.from(addr2, 'hex'))
      _value
    )

    console.log(output.amount().coin().toString())
  
    outputs.add(output);
  
    return outputs
  }
  
  export const getMockOutputsCustom = async (assetValue:string, adaValue:string) => {
    //Generate outputs
    const Cardano = await CardanoLib();
    // const outputs: Set<Cardano.TransactionOutput>= new Set();
    const outputs: TransactionOutputList = Cardano.TransactionOutputList.new();
  
    let output = Cardano.TransactionOutput.new(
      Cardano.Address.from_bech32(addr2), // Cardano.Address.from_bytes(Buffer.from(addr2, 'hex'))
      Cardano.Value.new(Cardano.BigInteger.from_str('4000000').as_u64() || 4n, Cardano.MultiAsset.new())
    )
  
    outputs.add(output);

    const _multiAsset = Cardano.MultiAsset.new();
    const _asset = Cardano.MapAssetNameToCoin.new();
    _asset.insert(
      Cardano.AssetName.from_hex(
        '6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7'
      ),
      Cardano.BigInteger.from_str(assetValue).as_u64() || 0n
    );
    _multiAsset.insert_assets(
      Cardano.ScriptHash.from_raw_bytes(
        Buffer.from('6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7', 'hex')
      ),
      _asset
    );

    const _value = Cardano.Value.new(Cardano.BigInteger.from_str(adaValue).as_u64()|| 0n, Cardano.MultiAsset.new());

    //Cardano.Value.new(BigNum.from_str('2000000'))
  
    output = Cardano.TransactionOutput.new(
      Cardano.Address.from_bech32(addr2), // Cardano.Address.from_bytes(Buffer.from(addr2, 'hex'))
      _value
    )

    console.log(output.amount().coin().toString())
  
    outputs.add(output);
  
    return outputs
  }
}

//Utxo ADA
// addr_test1qpq2eurm8qy7xgprcevsfy7daxp069m7w2sf5wkfyvyfsu7y9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqz2d94g
// [{ 
//   "tx_hash": "bc37156be94099045706843d4c6663ffc0feb67ee76f91165b4ba37cde55c57e", 
//   "tx_index": 0, 
//   "output_index": 0, 
//   "amount": [{ "unit": "lovelace", "quantity": "12214300" }], 
//   "block": "a036205b681d9c31cd1a8f060ed9e166c531a9dfe526b266e973f83bc0c694b8", 
//   "data_hash": null 
// }]

//Utxo Native Token
// addr_test1qqs6t4pym4ye2j5x99mlf6twwve48kw6wta4quh54muhagky9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqa8nufl
// [{
//   "tx_hash": "b70dc9e051913b9b4a34b95cf518041c00ac1dee73ba35e77b0badb1f156ff33",
//   "tx_index": 0,
//   "output_index": 0,
//   "amount": [{
//     "unit": "lovelace", "quantity": "2000000"
//   }, {
//     "unit": "6b8d07d69639e9413dd637a1a815a7323c69c86abbafb66dbfdb1aa7",
//     "quantity": "1"
//   }],
//   "block": "dab7e6f02e43892f5bf0256351dd33772959adece0dfa7a304e75b8135fe1bac",
//   "data_hash": null
// }, {
//     "tx_hash": "2bb712402f2431facd8c59920a96cff15fc966ef17c0cb860e91a1a43130926c",
//     "tx_index": 0,
//     "output_index": 0,
//     "amount": [{ "unit": "lovelace", "quantity": "1000000000" }],
//     "block": "54d0dd1d018f4ca3290177822c7472d5681d306ff5df54b595986b65040a5abf",
//     "data_hash": null
//   }]

// curl -H 'project_id: Mp8Bkd2hZe9IsStfTIsJGjhGMdlcVGjL' https://cardano-testnet.blockfrost.io/api/v0/addresses/addr_test1qpq2eurm8qy7xgprcevsfy7daxp069m7w2sf5wkfyvyfsu7y9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqz2d94g/utxos
// curl -H 'project_id: Mp8Bkd2hZe9IsStfTIsJGjhGMdlcVGjL' https://cardano-testnet.blockfrost.io/api/v0/addresses/addr_test1qqs6t4pym4ye2j5x99mlf6twwve48kw6wta4quh54muhagky9f2r8vesfwa09rvhhfzpdlwrehl046qsuc45luqgq6vqa8nufl/utxos

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