const axios = require('axios');
require('dotenv').config();
const chalk = require('chalk');
const log = console.log;

const main = async (tokenid) => {
	console.log(`${process.env.API}nfts/${process.env.NFTID}`)
  const promises = [
    axios.get(`${process.env.API}nfts/${process.env.CONTRACTID}/0`),
    axios.get(`${process.env.API}nfts/${process.env.NFTID}`),
  ];
  Promise.all(promises)
    .then((res) => {
      log(res[0].data);
      log(res[1].data);
    })
    .catch((e) => log(chalk.red('Error'), e.message));
};

main(process.argv[2]);
