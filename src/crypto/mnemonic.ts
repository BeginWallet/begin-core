import { generateMnemonic as _generateMnemonic } from 'bip39'

const generateMnemonic:any = () => {
    return _generateMnemonic(160)
}

export { generateMnemonic }