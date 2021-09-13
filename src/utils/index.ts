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