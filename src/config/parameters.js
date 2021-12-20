module.exports = {
  username: {
    type: 'string',
    min: 5,
  },
  country: {
    type:'string',
    min: 2,
  },
  network: {
    type: 'string',
    valid: ['mumbai', 'polygon', 'mintknight', 'rinkeby', 'mainnet']
  },
  value: {
    type: 'string',
    min: 1
  }
}
