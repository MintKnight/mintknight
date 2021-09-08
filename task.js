const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const config = {
  headers: { Authorization: `Bearer ${process.env.TOKEN}` },
};

const main = async (taskid) => {
  axios.get(`${process.env.API}tasks/${taskid}`, config)
    .then((res) => {
      log(res.data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main(process.argv[2]);
