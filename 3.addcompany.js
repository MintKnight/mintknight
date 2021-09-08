const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const company = {
  name: 'Gaswain Marketplace',
  taxId: '111A',
  address: 'Open Source Avenue',
  country: 'UK',
};

const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async () => {
  log(chalk.blue('Set company details'));
  axios.post(`${process.env.API}companies`, company, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
