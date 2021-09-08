const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const user = {
  username: process.env.MK_USERNAME,
  email: process.env.MK_EMAIL,
  password: process.env.MK_PASSWORD,
  telephone: '+555111',
};

const main = async () => {
  log(chalk.blue('Add One user'));
  axios.post(`${process.env.API}users/register`, user)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
