import Base from "./base";
import Account, { AccountContext, NetworkInfo } from './account';
import type {
  TransactionWitnessSet,
  // Transaction as CardanoTransaction,
  TransactionUnspentOutput,
  TransactionOutputs,
  BigNum,
  MultiAsset,
  AuxiliaryData,
  RewardAddress
} from "@emurgo/cardano-serialization-lib-browser";
import Address from "./address";
import { DataSignError } from "../config/config";

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
  coinsPerUtxoWord: BigNum,
  minUtxo: BigNum,
  minFeeA: BigNum,
  minFeeB: BigNum,
  poolDeposit: BigNum,
  keyDeposit: BigNum,
  maxValSize: number,
  maxTxSize: number,
  slot: number
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
      this.Cardano.Transaction.from_bytes(Buffer.from(tx, 'hex'));
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

    const paymentPubKeyHash = Buffer.from(
      paymentPubKey.hash().to_bytes()
    ).toString('hex');
    const stakePubKeyHash = Buffer.from(
      stakePubKey.hash().to_bytes()
    ).toString('hex');

    const rawTx = this.Cardano.Transaction.from_bytes(Buffer.from(tx, 'hex'));

    const txWitnessSet = rawTx.witness_set();
    const vKeyWitnesses = this.Cardano.Vkeywitnesses.new();
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

    txWitnessSet.set_vkeys(vKeyWitnesses);
    return txWitnessSet
  }

  async build(account: AccountContext,
    utxos: TransactionUnspentOutput[],
    outputs: TransactionOutputs,
    protocolParameters: ProtocolParameters,
    auxiliaryData?: AuxiliaryData) { //: Promise<CardanoTransaction> 

    const totalAssets = this.multiAssetCount(
      outputs.get(0).amount().multiasset()!
    );

    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_word(
        protocolParameters.coinsPerUtxoWord
      )
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA,
          protocolParameters.minFeeB
        )
      )
      .key_deposit(protocolParameters.keyDeposit)
      .pool_deposit(
        protocolParameters.poolDeposit
      )
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .ex_unit_prices(this.Cardano.ExUnitPrices.from_bytes(Buffer.from(parseFloat('0').toString())))
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);

    txBuilder.add_output(outputs.get(0));

    if (auxiliaryData) {
      txBuilder.set_auxiliary_data(auxiliaryData);
    }

    //txBuilder.set_ttl //TODO: Review it.
    txBuilder.set_ttl_bignum(
      this.Cardano.BigNum.from_str(
        (protocolParameters.slot + TX.invalid_hereafter).toString()
      )
    );

    const utxosCore = this.Cardano.TransactionUnspentOutputs.new();
    utxos.forEach((utxo) => utxosCore.add(utxo));

    txBuilder.add_inputs_from(utxosCore, 1);

    // txBuilder.balance(this.Cardano.Address.from_bech32(account.paymentAddr));

    const transaction = await txBuilder.construct();

    return transaction;
  }

  private multiAssetCount(multiAsset: MultiAsset) {
    if (!multiAsset) return 0;
    let count = 0;
    const policies = multiAsset.keys();
    for (let j = 0; j < multiAsset.len(); j++) {
      const policy = policies.get(j);
      const policyAssets = multiAsset.get(policy);
      const assetNames = policyAssets!.keys();
      for (let k = 0; k < assetNames.len(); k++) {
        count++;
      }
    }

    return count;
  };

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

    const signedSigStruc = accountKey.sign(toSign).to_bytes();
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
      this.Message.CBORValue.new_bytes(publicKey.as_bytes())
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

    const outputs = this.Cardano.TransactionOutputs.new();
    outputs.add(
      this.Cardano.TransactionOutput.new(
        this.Cardano.Address.from_bech32(account.paymentAddr),
        this.Cardano.Value.new(protocolParameters.keyDeposit)
      )
    );

    const getRandomImprove = CoinSelection(this.Cardano).getInstance();
    getRandomImprove.ProtocolParameters = protocolParameters;
    const selection = getRandomImprove.randomImprove(
      utxos,
      outputs,
      20
    );

    const inputs = selection.input;

    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_word(protocolParameters.coinsPerUtxoWord)
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA,
          protocolParameters.minFeeB
        )
      )
      .key_deposit(protocolParameters.keyDeposit)
      .pool_deposit(protocolParameters.poolDeposit)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .prefer_pure_change(true)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);
    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i];
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    }

    const certificates = this.Cardano.Certificates.new();
    if (!delegation.active)
      certificates.add(
        this.Cardano.Certificate.new_stake_registration(
          this.Cardano.StakeRegistration.new(
            this.Cardano.StakeCredential.from_keyhash(
              this.Cardano.Ed25519KeyHash.from_bytes(
                Buffer.from(account.stakePubKeyHash, 'hex')
              )
            )
          )
        )
      );

    certificates.add(
      this.Cardano.Certificate.new_stake_delegation(
        this.Cardano.StakeDelegation.new(
          this.Cardano.StakeCredential.from_keyhash(
            this.Cardano.Ed25519KeyHash.from_bytes(
              Buffer.from(account.stakePubKeyHash, 'hex')
            )
          ),
          this.Cardano.Ed25519KeyHash.from_bech32(
            poolIdBech32
          )
        )
      )
    );
    txBuilder.set_certs(certificates);

    txBuilder.set_ttl(protocolParameters.slot + TX.invalid_hereafter);
    txBuilder.add_change_if_needed(
      this.Cardano.Address.from_bech32(account.paymentAddr)
    );

    const transaction = this.Cardano.Transaction.new(
      txBuilder.build(),
      this.Cardano.TransactionWitnessSet.new()
    );

    return transaction;
  }

  async withdrawal(
    account: AccountContext,
    delegation: any,
    utxos: TransactionUnspentOutput[],
    protocolParameters: ProtocolParameters
  ) {

    const outputs = this.Cardano.TransactionOutputs.new();
    outputs.add(
      this.Cardano.TransactionOutput.new(
        this.Cardano.Address.from_bech32(account.paymentAddr),
        this.Cardano.Value.new(protocolParameters.minUtxo)
      )
    );

    const getRandomImprove = CoinSelection(this.Cardano).getInstance();
    getRandomImprove.ProtocolParameters = protocolParameters;
    const selection = getRandomImprove.randomImprove(
      utxos,
      outputs,
      20
    );

    const inputs = selection.input;
    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_word(protocolParameters.coinsPerUtxoWord)
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA,
          protocolParameters.minFeeB
        )
      )
      .key_deposit(protocolParameters.keyDeposit)
      .pool_deposit(protocolParameters.poolDeposit)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .prefer_pure_change(true)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);

    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i];
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    }

    const withdrawals = this.Cardano.Withdrawals.new();
    withdrawals.insert(
      this.Cardano.RewardAddress.from_address(
        this.Cardano.Address.from_bech32(account.rewardAddr)
      ) as RewardAddress,
      this.Cardano.BigNum.from_str(delegation.rewards)
    );

    txBuilder.set_withdrawals(withdrawals);

    txBuilder.set_ttl(protocolParameters.slot + TX.invalid_hereafter);
    txBuilder.add_change_if_needed(
      this.Cardano.Address.from_bech32(account.paymentAddr)
    );

    const transaction = this.Cardano.Transaction.new(
      txBuilder.build(),
      this.Cardano.TransactionWitnessSet.new()
    );

    return transaction;
  };

  async undelegate(
    account: AccountContext,
    delegation: any,
    utxos: TransactionUnspentOutput[],
    protocolParameters: ProtocolParameters
  ) {

    const outputs = this.Cardano.TransactionOutputs.new();
    outputs.add(
      this.Cardano.TransactionOutput.new(
        this.Cardano.Address.from_bech32(account.paymentAddr),
        this.Cardano.Value.new(this.Cardano.BigNum.from_str('0'))
      )
    );

    const getRandomImprove = CoinSelection(this.Cardano).getInstance();
    getRandomImprove.ProtocolParameters = protocolParameters;
    const selection = getRandomImprove.randomImprove(
      utxos,
      outputs,
      20
    );

    const inputs = selection.input;
    const txBuilderConfig = this.Cardano.TransactionBuilderConfigBuilder.new()
      .coins_per_utxo_word(protocolParameters.coinsPerUtxoWord)
      .fee_algo(
        this.Cardano.LinearFee.new(
          protocolParameters.minFeeA,
          protocolParameters.minFeeB
        )
      )
      .key_deposit(protocolParameters.keyDeposit)
      .pool_deposit(protocolParameters.poolDeposit)
      .max_tx_size(protocolParameters.maxTxSize)
      .max_value_size(protocolParameters.maxValSize)
      .prefer_pure_change(true)
      .build();

    const txBuilder = this.Cardano.TransactionBuilder.new(txBuilderConfig);
    for (let i = 0; i < inputs.length; i++) {
      const utxo = inputs[i];
      txBuilder.add_input(
        utxo.output().address(),
        utxo.input(),
        utxo.output().amount()
      );
    }

    if (delegation.rewards > 0) {
      const withdrawals = this.Cardano.Withdrawals.new();
      withdrawals.insert(
        this.Cardano.RewardAddress.from_address(
          this.Cardano.Address.from_bech32(account.rewardAddr)
        ) as RewardAddress,
        this.Cardano.BigNum.from_str(delegation.rewards)
      );

      txBuilder.set_withdrawals(withdrawals);
    }

    const certificates = this.Cardano.Certificates.new();

    certificates.add(
      this.Cardano.Certificate.new_stake_deregistration(
        this.Cardano.StakeDeregistration.new(
          this.Cardano.StakeCredential.from_keyhash(
            this.Cardano.Ed25519KeyHash.from_bytes(
              Buffer.from(account.stakePubKeyHash, 'hex')
            )
          )
        )
      )
    );

    txBuilder.set_certs(certificates);

    txBuilder.set_ttl(protocolParameters.slot + TX.invalid_hereafter);
    txBuilder.add_change_if_needed(
      this.Cardano.Address.from_bech32(account.paymentAddr)
    );

    const transaction = this.Cardano.Transaction.new(
      txBuilder.build(),
      this.Cardano.TransactionWitnessSet.new()
    );

    return transaction;
  };

}

export default Transaction