import { generateMnemonic as _generateMnemonic, wordlists } from 'bip39'

const generateMnemonic:any = (bytes:number) => {
    return _generateMnemonic(bytes)
}

export { generateMnemonic, wordlists }