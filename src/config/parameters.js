module.exports = {
  username: {
    type: 'string',
    min: 5
  },
  country: {
    type: 'string',
    min: 2
  },
  network: {
    type: 'string',
    valid: ['mumbai', 'polygon', 'localhost', 'rinkeby', 'mainnet']
  },
  value: {
    type: 'string',
    min: 1
  }
}
