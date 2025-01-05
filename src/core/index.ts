import Account from './account';
import Address from './address';
import Base, { BitcoinJsType, CardanoType, MessageType } from './base';
import BitcoinAccount from './chain/bitcoin/account';
import BitcoinTransaction from './chain/bitcoin/transaction';
import Transaction from './transaction';

export type CoreInstance = {
  Account: Account;
  Chain: {
    Bitcoin: BitcoinAccount
    BitcoinTransaction: BitcoinTransaction
  }
  Address: Address;
  Transaction: Transaction;
};

class CoreContext extends Base {
  getInstance(): CoreInstance {
    return {
      Account: new Account(this.Cardano),
      Chain: {
        Bitcoin: new BitcoinAccount(this.Cardano, undefined, this.Bitcoin),
        BitcoinTransaction: new BitcoinTransaction(this.Cardano, undefined, this.Bitcoin)
      },
      Address: new Address(this.Cardano),
      Transaction: new Transaction(this.Cardano, this.Message),
    };
  }
}

const Core = (Cardano: CardanoType, Message?: MessageType, Bitcoin?: BitcoinJsType) =>
  new CoreContext(Cardano, Message, Bitcoin);

export default Core;
