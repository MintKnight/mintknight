const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;


const user = {
  email: process.env.MK_EMAIL, 
  password: process.env.MK_PASSWORD,
};

const main = async () => {
  log(chalk.blue('Login'));
  axios.post(`${process.env.API}users/login`, user)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
