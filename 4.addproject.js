const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const project = {
  name: 'Gaswain NFTs',
  description: 'Marketplace for NFTs',
  network: 'mumbai'
};

const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async () => {
  log(chalk.blue('Add project'));
  axios.post(`${process.env.API}projects`, project, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
