require('dotenv').config();
const axios = require('axios');
const chalk = require('chalk');
const log = console.log;

const transferForm = {
  contractId: process.env.CONTRACTID,
  from: process.env.WALLET1ID,
  skey: process.env.WALLET1KEY,
  to: process.env.WALLET2ID,
  address: '0x',
  tokenId: 0
};


const main = async () => {
  log(chalk.blue('Transfer NFT'));
  const config = { headers: { Authorization: `Bearer ${process.env.APIKEY}` } };

  axios.post(`${process.env.API}nfts/transfer`, transferForm, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
