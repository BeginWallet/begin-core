import Base from "./base";
import Account, { AccountContext, NetworkInfo } from './account';
import {
  TransactionWitnessSet,
  // Transaction as CardanoTransaction,
  TransactionUnspentOutput,
  TransactionOutputList,
  BigInteger,
  // MultiAsset,
  AuxiliaryData,
  // RewardAddress,
  RewardAddress,
} from "@dcspark/cardano-multiplatform-lib-browser" //"../../temp_modules/@dcspark/cardano-multiplatform-lib-browser";
import Address from "./address";
import { DataSignError } from "../config/config";
import { COSESign1Builder } from "@emurgo/cardano-message-signing-browser";

export const enum TRANSACITON_SIZES {
  MultiAsset = 5848,
  Value = 5860,
  Utxo = 5980
}

export const enum TRANSCTION_TYPES {
  Default,
  Delegation,
  WithdrawalReward,
}

export interface ProtocolParameters {
  coinsPerUtxoSize: BigInteger,
  coinsPerUtxoWord: BigInteger,
  minUtxo: BigInteger,
  minFeeA: BigInteger,
  minFeeB: BigInteger,
  poolDeposit: BigInteger,
  keyDeposit: BigInteger,
  maxValSize: number,
  maxTxSize: number,
  slot: number,
  collateralPercentage: number,
  maxCollateralInputs: number,
  priceMem: number,
  priceStep: number,
  refScriptCostPerBytes: BigInteger,
}

export const TX = {
  invalid_hereafter: 3600 * 6, //6h from current slot
};

class Transaction extends Base {

  /**
   * Verify Transaction from Request
   * @param tx 
   */
  verify(tx: string) {
    try {
      this.Cardano.Transaction.from_cbor_hex(tx);
    } catch (error) {
      throw new Error("Invalid Request");
    }
  }

  sign(tx: string, keyHashes: any[],
    password: string, accountIndex: number,
    encryptedRootKey: string, partialSign: boolean = false): TransactionWitnessSet {
    const account = new Account(this.Cardano);
    const { paymentKey, stakeKey } = account.generateAccountKeyPair(
      password,
      accountIndex,
      encryptedRootKey
    )

    const paymentPubKey = paymentKey.to_public();
    const stakePubKey = stakeKey.to_public();

    const paymentPubKeyHash = paymentPubKey.hash().to_hex();
    const stakePubKeyHash = stakePubKey.hash().to_hex();

    const rawTx = this.Cardano.Transaction.from_cbor_hex(tx);

    // const txWitnessSet = rawTx.witness_set();
    const txWitnessSet = this.Cardano.TransactionWitnessSet.new();
    const vKeyWitnesses = this.Cardano.VkeywitnessList.new();
    const txHash = this.Cardano.hash_transaction(rawTx.body());

    keyHashes.forEach(keyHash => {
      let sigingKey;
      if (keyHash === paymentPubKeyHash) sigingKey = paymentKey;
      else if (keyHash === stakePubKeyHash) sigingKey = stakeKey;
      else if (!partialSign) throw 'Sign Error Proof Generation';
      else return;

      const vKey = this.Cardano.make_vkey_witness(txHash, sigingKey);
      vKeyWitnesses.add(vKey)
    });

    paymentKey.free();
    stakeKey.free();

    txWitnessSet.set_vkeywitnesses(vKeyWitnesses);
    return txWitnessSet
  }

  async build(account: AccountContext,
    utxos: TransactionUnspentOutput[],
    outputs: TransactionOutputList,
    protocolParameters: ProtocolParameters,
    auxiliaryData?: AuxiliaryData) {

    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_byte(
        protocolParameters.coinsPerUtxoSize.as_u64() || 0n
      )
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA.as_u64() || 0n,
          protocolParameters.minFeeB.as_u64() || 0n,
          protocolParameters.refScriptCostPerBytes.as_u64() || 0n
        )
      )
      .key_deposit(protocolParameters.keyDeposit.as_u64() || 0n)
      .pool_deposit(
        protocolParameters.poolDeposit.as_u64() || 0n
      )
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .ex_unit_prices(this.Cardano.ExUnitPrices.new(
        this.Cardano.Rational.new(0n, 0n),
        this.Cardano.Rational.new(0n, 0n),
        // this.Cardano.UnitInterval.new(zero, zero),
        // this.Cardano.UnitInterval.new(zero, zero)
      ))
      .collateral_percentage(protocolParameters.collateralPercentage)
      .max_collateral_inputs(protocolParameters.maxCollateralInputs)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);
    // let isMultiAssetTx = false;

    for (let index = 0; index < outputs.len(); index++) {
      const output = outputs.get(index);
      // if (!isMultiAssetTx){
      //   isMultiAssetTx = output.amount().multiasset() !== undefined;
      // }

      txBuilder.add_output(
        this.Cardano.SingleOutputBuilderResult.new(output)
      );
    }

    // txBuilder.add_output(
    //   this.Cardano.SingleOutputBuilderResult.new(outputs.get(0))
    // );

    if (auxiliaryData) {
      txBuilder.set_auxiliary_data(auxiliaryData);
    }

    txBuilder.set_ttl(
      this.Cardano.BigInteger.from_str(
        (protocolParameters.slot + TX.invalid_hereafter).toString()
      ).as_u64() || 0n
    );

    utxos
    .forEach((utxo) =>  txBuilder.add_input(
      this.Cardano.SingleInputBuilder.new(
          utxo.input(), 
          utxo.output()
        )
        .payment_key()
    ));
   

    // utxos
    // .forEach((utxo) => txBuilder
    //   .add_utxo(
    //     this.Cardano.SingleInputBuilder.new(utxo.input(), utxo.output()).payment_key()
    //   )
    // )
    // txBuilder.select_utxos(CoinSelectionStrategyCIP2.LargestFirstMultiAsset)

    // txBuilder.add_change_if_needed(this.Cardano.Address.from_bech32(account.paymentAddr));

    const transaction = txBuilder.build(
      this.Cardano.ChangeSelectionAlgo.Default,
      this.Cardano.Address.from_bech32(account.paymentAddr))
      .build_unchecked();
    // const transaction = txBuilder.build_tx()
    // const transaction = this.Cardano.Transaction.new(
    //   txBuilder.build().body(),
    //   this.Cardano.TransactionWitnessSet.new(),
    //   txBuilder.get_auxiliary_data()
    // );

    return transaction;
  }

  // private multiAssetCount(multiAsset: MultiAsset) {
  //   if (!multiAsset) return 0;
  //   let count = 0;
  //   const policies = multiAsset.keys();
  //   for (let j = 0; j < multiAsset.len(); j++) {
  //     const policy = policies.get(j);
  //     const policyAssets = multiAsset.get(policy);
  //     const assetNames = policyAssets!.keys();
  //     for (let k = 0; k < assetNames.len(); k++) {
  //       count++;
  //     }
  //   }

  //   return count;
  // };

  async signData(
    address: string,
    payload: string,
    password: string,
    accountIndex: number,
    encryptedRootKey: string,
    networkInfo: NetworkInfo,
  ) {
    if (!this.Message) {
      // If msg object not defined.
      return {};
    }

    const account = new Account(this.Cardano);
    const addressClass = new Address(this.Cardano);
    const keyHash = addressClass.extractKeyHash(address, networkInfo);
    const prefix = keyHash.slice(0, 5);
    const { paymentKey, stakeKey } = account.generateAccountKeyPair(
      password,
      accountIndex,
      encryptedRootKey
    )
    const accountKey = prefix === 'hbas_' ? paymentKey : stakeKey;

    const publicKey = accountKey.to_public();
    if (keyHash !== publicKey.hash().to_bech32(prefix))
      throw DataSignError.ProofGeneration;
    const protectedHeaders = this.Message.HeaderMap.new();
    protectedHeaders.set_algorithm_id(
      this.Message.Label.from_algorithm_id(this.Message.AlgorithmId.EdDSA)
    );
    // protectedHeaders.set_key_id(publicKey.as_bytes()); // Removed to adhere to CIP-30
    protectedHeaders.set_header(
      this.Message.Label.new_text('address'),
      this.Message.CBORValue.new_bytes(Buffer.from(address, 'hex'))
    );
    const protectedSerialized =
      this.Message.ProtectedHeaderMap.new(protectedHeaders);
    const unprotectedHeaders = this.Message.HeaderMap.new();
    const headers = this.Message.Headers.new(
      protectedSerialized,
      unprotectedHeaders
    );
    const builder = this.Message.COSESign1Builder.new(
      headers,
      Buffer.from(payload, 'hex'),
      false
    );
    const toSign = builder.make_data_to_sign().to_bytes();

    const signedSigStruc = accountKey.sign(toSign).to_raw_bytes();
    const coseSign1 = builder.build(signedSigStruc);

    stakeKey.free();
    paymentKey.free();

    const key = this.Message.COSEKey.new(
      this.Message.Label.from_key_type(this.Message.KeyType.OKP)
    );
    key.set_algorithm_id(
      this.Message.Label.from_algorithm_id(this.Message.AlgorithmId.EdDSA)
    );
    key.set_header(
      this.Message.Label.new_int(
        this.Message.Int.new_negative(this.Message.BigNum.from_str('1'))
      ),
      this.Message.CBORValue.new_int(
        this.Message.Int.new_i32(6) //Loader.Message.CurveType.Ed25519
      )
    ); // crv (-1) set to Ed25519 (6)
    key.set_header(
      this.Message.Label.new_int(
        this.Message.Int.new_negative(this.Message.BigNum.from_str('2'))
      ),
      this.Message.CBORValue.new_bytes(publicKey.to_raw_bytes())
    ); // x (-2) set to public key

    return {
      signature: Buffer.from(coseSign1.to_bytes()).toString('hex'),
      key: Buffer.from(key.to_bytes()).toString('hex'),
    };
  };

  generateCoseSig1(address: string, payload: any) {
    if (!this.Message) {
      // If msg object not defined.
      return {};
    }

    const protectedHeaders = this.Message.HeaderMap.new();
    protectedHeaders.set_algorithm_id(this.Message.Label.from_algorithm_id(this.Message.AlgorithmId.EdDSA));
    protectedHeaders.set_header(
      this.Message.Label.new_text('address'),
      this.Message.CBORValue.new_bytes(Buffer.from(address, 'hex'))
    );
    const protectedSerialized = this.Message.ProtectedHeaderMap.new(protectedHeaders);
    const unprotectedHeaders = this.Message.HeaderMap.new();
    const headers = this.Message.Headers.new(protectedSerialized, unprotectedHeaders);
    const builder = this.Message.COSESign1Builder.new(headers, Buffer.from(payload, 'hex'), false);
    const toSign = builder.make_data_to_sign().to_bytes();  

    return {
      builder: builder,
      sigStructure: Buffer.from(toSign).toString('hex'),
    };
  };

  async signDataHW(publickeyHex: string, signedSigStruc: string, builder: COSESign1Builder) {
    if (!this.Message) {
      // If msg object not defined.
      return {};
    }

    const coseSign1 = builder.build(Buffer.from(signedSigStruc, 'hex'));

    const key = this.Message.COSEKey.new(this.Message.Label.from_key_type(this.Message.KeyType.OKP));
    key.set_algorithm_id(this.Message.Label.from_algorithm_id(this.Message.AlgorithmId.EdDSA));
    key.set_header(
      this.Message.Label.new_int(this.Message.Int.new_negative(this.Message.BigNum.from_str('1'))),
      this.Message.CBORValue.new_int(
        this.Message.Int.new_i32(6) //Loader.Message.CurveType.Ed25519
      )
    ); // crv (-1) set to Ed25519 (6)
    key.set_header(
      this.Message.Label.new_int(this.Message.Int.new_negative(this.Message.BigNum.from_str('2'))),
      this.Message.CBORValue.new_bytes(Buffer.from(publickeyHex, 'hex'))
    ); // x (-2) set to public key

    return {
      signature: Buffer.from(coseSign1.to_bytes()).toString('hex'),
      key: Buffer.from(key.to_bytes()).toString('hex'),
    };
  };

  async delegation(
    account: AccountContext,
    poolIdBech32: string,
    delegation: any,
    utxos: TransactionUnspentOutput[],
    protocolParameters: ProtocolParameters) {

    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_byte(
        protocolParameters.coinsPerUtxoSize.as_u64() || 0n
      )
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA.as_u64() || 0n,
          protocolParameters.minFeeB.as_u64() || 0n,
          protocolParameters.refScriptCostPerBytes.as_u64() || 0n
        )
      )
      .key_deposit(protocolParameters.keyDeposit.as_u64() || 0n)
      .pool_deposit(protocolParameters.poolDeposit.as_u64() || 0n)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .ex_unit_prices(this.Cardano.ExUnitPrices.new(
        this.Cardano.Rational.new(0n, 0n),
        this.Cardano.Rational.new(0n, 0n),
      ))
      .collateral_percentage(protocolParameters.collateralPercentage)
      .max_collateral_inputs(protocolParameters.maxCollateralInputs)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);

    // const certificates = this.Cardano.Certificates.new();
    if (!delegation.active)
      txBuilder.add_cert(
        this.Cardano.SingleCertificateBuilder.new(
          this.Cardano.Certificate.new_stake_registration(
            this.Cardano.Credential.new_pub_key(
                this.Cardano.Ed25519KeyHash.from_raw_bytes(
                  Buffer.from(account.stakePubKeyHash, 'hex')
                )
            )
          )
        ).payment_key()
      );

    txBuilder.add_cert(
      this.Cardano.SingleCertificateBuilder.new(
        this.Cardano.Certificate.new_stake_delegation(
          this.Cardano.Credential.new_pub_key(
              this.Cardano.Ed25519KeyHash.from_raw_bytes(
                Buffer.from(account.stakePubKeyHash, 'hex')
              )
            ),
            this.Cardano.Ed25519KeyHash.from_bech32(
              poolIdBech32
            )
          )
        ).skip_witness()
    );

    txBuilder.set_ttl(
      this.Cardano.BigInteger.from_str(
        (protocolParameters.slot + TX.invalid_hereafter).toString()
      ).as_u64() || 0n
    );

    utxos.forEach((utxo) => txBuilder
      .add_input(
        this.Cardano.SingleInputBuilder.new(utxo.input(), utxo.output()).payment_key()
      )
    )
    txBuilder.select_utxos(this.Cardano.CoinSelectionStrategyCIP2.RandomImprove)

    // txBuilder.add_change_if_needed(
    //   this.Cardano.Address.from_bech32(account.paymentAddr)
    // );

    const transaction = txBuilder.build(
      this.Cardano.ChangeSelectionAlgo.Default,
      this.Cardano.Address.from_bech32(account.paymentAddr))
      .build_unchecked();

    // const transaction = this.Cardano.Transaction.new(
    //   txBuilder.build(),
    //   this.Cardano.TransactionWitnessSet.new()
    // );

    return transaction;
  }

  async withdrawal(
    account: AccountContext,
    delegation: any,
    utxos: TransactionUnspentOutput[],
    protocolParameters: ProtocolParameters
  ) {

    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_byte(
        protocolParameters.coinsPerUtxoSize.as_u64() || 0n
      )
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA.as_u64() || 0n,
          protocolParameters.minFeeB.as_u64() || 0n,
          protocolParameters.refScriptCostPerBytes.as_u64() || 0n
        )
      )
      .key_deposit(protocolParameters.keyDeposit.as_u64() || 0n)
      .pool_deposit(protocolParameters.poolDeposit.as_u64() || 0n)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .ex_unit_prices(this.Cardano.ExUnitPrices.new(
        this.Cardano.Rational.new(0n, 0n),
        this.Cardano.Rational.new(0n, 0n)
      ))
      .collateral_percentage(protocolParameters.collateralPercentage)
      .max_collateral_inputs(protocolParameters.maxCollateralInputs)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);

    // const withdrawals = this.Cardano.Withdrawals.new();
    // withdrawals.insert(
    //   this.Cardano.RewardAddress.from_address(
    //     this.Cardano.Address.from_bech32(account.rewardAddr)
    //   ) as RewardAddress,
    //   this.Cardano.BigInteger.from_str(delegation.rewards)
    // );

    txBuilder.add_withdrawal(
      this.Cardano.SingleWithdrawalBuilder.new(
        this.Cardano.RewardAddress.from_address(
          this.Cardano.Address.from_bech32(account.rewardAddr)
        ) as RewardAddress,
        this.Cardano.BigInteger.from_str(delegation.rewards).as_u64() || 0n
      ).payment_key()
    );

    txBuilder.set_ttl(
      this.Cardano.BigInteger.from_str(
        (protocolParameters.slot + TX.invalid_hereafter).toString()
      ).as_u64() || 0n
    );

    utxos.forEach((utxo) => txBuilder
      .add_input(
        this.Cardano.SingleInputBuilder.new(utxo.input(), utxo.output()).payment_key()
      )
    )
    txBuilder.select_utxos(this.Cardano.CoinSelectionStrategyCIP2.RandomImprove);

    // txBuilder.add_change_if_needed(
    //   this.Cardano.Address.from_bech32(account.paymentAddr)
    // );

    const transaction = txBuilder.build(
      this.Cardano.ChangeSelectionAlgo.Default,
      this.Cardano.Address.from_bech32(account.paymentAddr))
      .build_unchecked();


    // const transaction = this.Cardano.Transaction.new(
    //   txBuilder.build(),
    //   this.Cardano.TransactionWitnessSet.new()
    // );

    return transaction;
  };

  async undelegate(
    account: AccountContext,
    delegation: any,
    utxos: TransactionUnspentOutput[],
    protocolParameters: ProtocolParameters
  ) {
    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_byte(
        protocolParameters.coinsPerUtxoSize.as_u64() || 0n
      )
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA.as_u64() || 0n,
          protocolParameters.minFeeB.as_u64() || 0n,
          protocolParameters.refScriptCostPerBytes.as_u64() || 0n
        )
      )
      .key_deposit(protocolParameters.keyDeposit.as_u64() || 0n)
      .pool_deposit(protocolParameters.poolDeposit.as_u64() || 0n)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .ex_unit_prices(this.Cardano.ExUnitPrices.new(
        this.Cardano.Rational.new(0n, 0n),
        this.Cardano.Rational.new(0n, 0n),
      ))
      .collateral_percentage(protocolParameters.collateralPercentage)
      .max_collateral_inputs(protocolParameters.maxCollateralInputs)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);

    if (delegation.rewards > 0) {
      txBuilder.add_withdrawal(
        this.Cardano.SingleWithdrawalBuilder.new(
          this.Cardano.RewardAddress.from_address(
            this.Cardano.Address.from_bech32(account.rewardAddr)
          ) as RewardAddress,
          this.Cardano.BigInteger.from_str(delegation.rewards).as_u64() || 0n
        ).payment_key()
      );
    }

    txBuilder.add_cert(
      this.Cardano.SingleCertificateBuilder.new(
        this.Cardano.Certificate.new_stake_deregistration(
            this.Cardano.Credential.new_pub_key(
              this.Cardano.Ed25519KeyHash.from_raw_bytes(
                Buffer.from(account.stakePubKeyHash, 'hex')
              )
            )
          )
        ).payment_key()
    );

    txBuilder.set_ttl(
      this.Cardano.BigInteger.from_str(
        (protocolParameters.slot + TX.invalid_hereafter).toString()
      ).as_u64() || 0n
    );

    utxos.forEach((utxo) => txBuilder
      .add_utxo(
        this.Cardano.SingleInputBuilder.new(utxo.input(), utxo.output()).payment_key()
      )
    )
    txBuilder.select_utxos(this.Cardano.CoinSelectionStrategyCIP2.LargestFirstMultiAsset)

    // txBuilder.add_change_if_needed(
    //   this.Cardano.Address.from_bech32(account.paymentAddr)
    // );

    const transaction = txBuilder.build(
      this.Cardano.ChangeSelectionAlgo.Default,
      this.Cardano.Address.from_bech32(account.paymentAddr))
      .build_unchecked();

    // const transaction = this.Cardano.Transaction.new(
    //   txBuilder.build(),
    //   this.Cardano.TransactionWitnessSet.new()
    // );

    return transaction;
  };

}

export default Transaction