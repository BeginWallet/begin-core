import Account from "./account"
import Address from "./address"
import Base, { CardanoType } from "./base"
import Transaction from "./transaction"

type CoreInstance = {
    Account: Account,
    Address: Address,
    Transaction: Transaction
}

class CoreContext extends Base {
    
    getInstance(): CoreInstance {
        return {
            Account: new Account(this.Cardano),
            Address: new Address(this.Cardano),
            Transaction: new Transaction(this.Cardano),
        }
    }
}

const Core = (Cardano:CardanoType) => (new CoreContext(Cardano));

export default Core