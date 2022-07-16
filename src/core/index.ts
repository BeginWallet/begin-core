import Account from "./account"
import Address from "./address"
import Base, { CardanoType, MessageType }  from "./base"
import Transaction from "./transaction"

export type CoreInstance = {
    Account: Account,
    Address: Address,
    Transaction: Transaction
}

class CoreContext extends Base {
    
    getInstance(): CoreInstance {
        return {
            Account: new Account(this.Cardano),
            Address: new Address(this.Cardano),
            Transaction: new Transaction(this.Cardano, this.Message),
        }
    }
}

const Core = (Cardano:CardanoType, Message?:MessageType) => (new CoreContext(Cardano, Message));

export default Core