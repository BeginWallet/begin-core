import Base from "./base";
import Account, { AccountContext } from './account';
import { CSL } from '@cardano-sdk/core';
import { defaultSelectionConstraints, InputSelectionParameters, ProtocolParametersForInputSelection, roundRobinRandomImprove } from '@cardano-sdk/cip2';
import { BigNum,
    TransactionWitnessSet, Transaction as CardanoTransaction, TransactionUnspentOutput, TransactionOutput } from "@emurgo/cardano-serialization-lib-asmjs";

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

interface ProtocolParametes {
    minUtxo: BigNum,
    linearFee: {
        minFeeA: BigNum,
        minFeeB: BigNum
    },
    maxTxSize: number,
    poolDeposit: BigNum,
    keyDeposit: BigNum,
    slot: number
}

export const TX = {
    invalid_hereafter: 3600 * 2, //2h from current slot
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
        password:string, accountIndex: number,
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

    async build(account:AccountContext, utxos:Set<TransactionUnspentOutput>, outputs:Set<TransactionOutput>, protocolParams?: ProtocolParametes): Promise<CardanoTransaction | any> {

        console.log(account);
        console.log(protocolParams);

        const buildTxOfLength = (length: number) => async () => ({ to_bytes: () => ({ length }) } as CSL.Transaction);

        const getRandomImprove = roundRobinRandomImprove(this.Cardano)
        const protocolParameters = {
            minFeeCoefficient: 44,
            minFeeConstant: 155381,
            coinsPerUtxoWord: 34482,
            maxTxSize: 16384,
            maxValueSize: 5000
          } as ProtocolParametersForInputSelection;
          
        const inputParams: InputSelectionParameters = {
            utxo : utxos,
            outputs: outputs,
            // constraints: SelectionConstraints.mockConstraintsToConstraints()
            constraints: defaultSelectionConstraints({
                csl: this.Cardano,
                protocolParameters,
                buildTx: buildTxOfLength(protocolParameters.maxTxSize!)
            })
        };

        const data = await getRandomImprove.select(inputParams);
        console.log(data); 
        // results();

        return false;
    
    
    // TODO: Refactory the whole code down.

        //TODO: Implement multiAssetCount and CoinSelection algo
        // *** REFERENCE CODE
        // const totalAssets = await multiAssetCount(
        //     outputs.get(0).amount().multiasset()
        //   );
        //   CoinSelection.setProtocolParameters(
        //     protocolParameters.minUtxo,
        //     protocolParameters.linearFee.minFeeA,
        //     protocolParameters.linearFee.minFeeB,
        //     protocolParameters.maxTxSize.toString()
        //   );
        //   const selection = await CoinSelection.randomImprove(
        //     utxos,
        //     outputs,
        //     20 + totalAssets
        //   );
        //   const inputs = selection.input;
        
    //     console.log(utxos) //TODO: Remove it
    //     const inputs:any[] = [];

    //     const txBuilder = this.transactionBuilder(protocolParams);

    //     inputs.forEach(utxo => {
    //         txBuilder.add_input(
    //             utxo.output().address(),
    //             utxo.input(),
    //             utxo.output().amount()
    //         )
    //     });

    //     //TODO: Double check possibily to have more outputs add them all.
    //     txBuilder.add_output(outputs.get(0));

    //     //TODO: Implement after CoinSelection done
    //     // const change = selection.change;
    //     const change:any = {};
    //     const changeMultiAssets:any = change.multiasset();

    //     //Check for the Change Value size, and if multiasset is not too big for a single output.
    //     if (changeMultiAssets && change.to_bytes().length * 2 > TRANSACITON_SIZES.Value) {
    //         const partialChange = this.Cardano.Value.new(
    //             this.Cardano.BigNum.from_str('0')
    //         );

    //         const partialMultiAssets = this.makeMultiAssetsPatial(changeMultiAssets);
    //         partialChange.set_multiasset(partialMultiAssets);

    //         //TODO: Replace for minADA helper function
    //         const minAda = this.Cardano.min_ada_required(
    //             partialChange,
    //             protocolParams.minUtxo
    //         );
    //         partialChange.set_coin(minAda);

    //         txBuilder.add_output(
    //             this.Cardano.TransactionOutput.new(
    //                 this.Cardano.Address.from_bech32(account.paymentAddr),
    //                 partialChange
    //             )
    //         );
    //     }

    //     txBuilder.set_ttl(protocolParams.slot + TX.invalid_hereafter);
    //     txBuilder.add_change_if_needed(
    //         this.Cardano.Address.from_bech32(account.paymentAddr)
    //     );

    //     const transaction = this.Cardano.Transaction.new(
    //         txBuilder.build(),
    //         this.Cardano.TransactionWitnessSet.new()
    //     );

    //     const txSize = transaction.to_bytes().length * 2;
    //     if (txSize > protocolParams.maxTxSize) throw new Error('Tx max size limit');

    //     return transaction;
    // }

    // private transactionBuilder(protocolParams: ProtocolParametes): TransactionBuilder {
    //     const txBuilder = this.Cardano.TransactionBuilder.new(
    //         this.Cardano.LinearFee.new(
    //             protocolParams.linearFee.minFeeA,
    //             protocolParams.linearFee.minFeeB
    //         ),
    //         protocolParams.minUtxo,
    //         protocolParams.poolDeposit,
    //         protocolParams.keyDeposit,
    //         1000, //TODO: Fix it max value size???
    //         protocolParams.maxTxSize
    //     )

    //     return txBuilder;
    }

    //TODO: Double check this code after build and integration of cardano-message-signing
    // private makeMultiAssetsPatial(changeMultiAssets:any) : MultiAsset {
    //     const policies:any = changeMultiAssets.keys();
    //     const partialMultiAssets = this.Cardano.MultiAsset.new();

    //     for (let j = 0; j < changeMultiAssets.len(); j++) {
    //         const policy = policies.get(j);
    //         const policyAssets = changeMultiAssets.get(policy);
    //         const assetNames = policyAssets.keys();
    //         const assets = this.Cardano.Assets.new();
    //         for (let k = 0; k < assetNames.len(); k++) {
    //           const policyAsset = assetNames.get(k);
    //           const quantity = policyAssets.get(policyAsset);
    //           assets.insert(policyAsset, quantity);
    //           //check size
    //           const checkMultiAssets = this.Cardano.MultiAsset.from_bytes(
    //             partialMultiAssets.to_bytes()
    //           );
    //           checkMultiAssets.insert(policy, assets);
    //           if (checkMultiAssets.to_bytes().length * 2 >= TRANSACITON_SIZES.MultiAsset) {
    //             partialMultiAssets.insert(policy, assets);
    //             return partialMultiAssets;
    //           }
    //         }
    //         partialMultiAssets.insert(policy, assets);
    //     }

    //     return partialMultiAssets;
    // }

}

export default Transaction