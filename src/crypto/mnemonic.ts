import { generateMnemonic as _generateMnemonic } from 'bip39'

const generateMnemonic:any = (bytes:number) => {
    return _generateMnemonic(bytes)
}

export { generateMnemonic }