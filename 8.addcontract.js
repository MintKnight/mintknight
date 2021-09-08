const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const contract= {
  erc: 721,
  name: 'MegaCollection',
  symbol: 'IN1',
  description: 'Influencer #1',
  totalNfts: 100,
  campaignId: process.env.CAMPAIGNID,
  walletId: process.env.MINTERID
};

const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async () => {
  log(chalk.blue('Add Collection'));
  axios.post(`${process.env.API}contracts`, contract, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
