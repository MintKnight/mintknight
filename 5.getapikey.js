const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;


const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async () => {
  log(chalk.blue('Get API Key'));
  axios.get(`${process.env.API}projects/apikey/${process.env.PROJECTID}`, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main();
