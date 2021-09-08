const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const campaign = {
  name: 'Influencer Campaign #1',
  description: 'Battle with the influencer',
  projectId: process.env.PROJECTID,
};

const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async () => {
  axios.post(`${process.env.API}campaigns`, campaign, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
