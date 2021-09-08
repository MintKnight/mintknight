const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const config = {
  headers: { Authorization: `Bearer ${process.env.APIKEY}` },
};

const wallet = {
  userRef: 'internalref1'
}

const main = async () => {
  log(chalk.blue('Add One user'));
  axios.post(`${process.env.API}nfts/wallet`, wallet, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
