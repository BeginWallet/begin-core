

import Account from "./account"
import Address from "./address"
import Transaction from "./transaction"

type CoreType = {
    Account: typeof Account,
    Address: typeof Address,
    Transaction: typeof Transaction
}

const Core:CoreType = {
    Account,
    Address,
    Transaction
}
export default Core