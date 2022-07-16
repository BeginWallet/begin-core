export const enum NETWORK_ID {
    mainnet = 'mainnet',
    testnet = 'testnet'
}

export const enum CARDANO_NETWORK_ID {
    mainnet = 1,
    testnet = 0
}

export const DataSignError = {
    ProofGeneration: {
      code: 1,
      info: 'Wallet could not sign the data (e.g. does not have the secret key associated with the address).',
    },
    AddressNotPK: {
      code: 2,
      info: 'Address was not a P2PK address or Reward address and thus had no SK associated with it.',
    },
    UserDeclined: { code: 3, info: 'User declined to sign the data.' },
    InvalidFormat: {
      code: 4,
      info: 'If a wallet enforces data format requirements, this error signifies that the data did not conform to valid formats.',
    },
  };